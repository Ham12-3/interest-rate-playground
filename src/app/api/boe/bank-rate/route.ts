import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Define the structure of our response
interface DataPoint {
  date: string;
  value: number;
}

interface BankRateResponse {
  seriesCode: string;
  points: DataPoint[];
  changesOnly: DataPoint[];
  latest: DataPoint | null;
}

// Helper function to extract value from XML node (supports both element and attribute forms)
function extractValue(node: unknown, key: string): string | undefined {
  if (!node || typeof node !== 'object') return undefined;
  const obj = node as Record<string, unknown>;
  
  // Try attribute form first (with @_ prefix), then direct property
  // fast-xml-parser prefixes attributes with @_ when ignoreAttributes: false
  const attrValue = obj[`@_${key}`] as string | undefined;
  if (attrValue !== undefined && attrValue !== null) {
    return String(attrValue);
  }
  
  // Try direct property
  const directValue = obj[key] as string | undefined;
  if (directValue !== undefined && directValue !== null) {
    return String(directValue);
  }
  
  return undefined;
}

// Helper function to parse and sort data points
function parseDataPoints(observations: unknown[]): DataPoint[] {
  const points: DataPoint[] = [];
  const seenDates = new Set<string>();

  for (const obs of observations) {
    if (!obs || typeof obs !== 'object') continue;
    
    const obj = obs as Record<string, unknown>;
    
    // Check if this observation has a Cube array (Bank of England structure)
    const cubeArray = obj.Cube || obj.cube;
    if (cubeArray) {
      // Cube is an array of data points
      const cubes = Array.isArray(cubeArray) ? cubeArray : [cubeArray];
      
      for (const cube of cubes) {
        if (!cube || typeof cube !== 'object') continue;
        
        // Try both TIME_PERIOD and TIME (Bank of England uses TIME in Cube elements)
        const timePeriod = extractValue(cube, 'TIME_PERIOD') || extractValue(cube, 'TIME');
        const obsValue = extractValue(cube, 'OBS_VALUE');

        if (timePeriod && obsValue) {
          // De-duplicate by date (keep first occurrence after sorting)
          if (!seenDates.has(timePeriod)) {
            seenDates.add(timePeriod);
            points.push({
              date: timePeriod,
              value: parseFloat(String(obsValue)),
            });
          }
        }
      }
    } else {
      // Direct observation (not wrapped in Cube array)
      // Try both TIME_PERIOD and TIME
      const timePeriod = extractValue(obs, 'TIME_PERIOD') || extractValue(obs, 'TIME');
      const obsValue = extractValue(obs, 'OBS_VALUE');

      if (timePeriod && obsValue) {
        // De-duplicate by date (keep first occurrence after sorting)
        if (!seenDates.has(timePeriod)) {
          seenDates.add(timePeriod);
          points.push({
            date: timePeriod,
            value: parseFloat(String(obsValue)),
          });
        }
      }
    }
  }

  // Sort by date ascending
  points.sort((a, b) => a.date.localeCompare(b.date));

  return points;
}

// Helper function to filter points to only include changes
function getChangesOnly(points: DataPoint[]): DataPoint[] {
  if (points.length === 0) return [];

  const changes: DataPoint[] = [points[0]]; // Always include first point

  for (let i = 1; i < points.length; i++) {
    if (points[i].value !== points[i - 1].value) {
      changes.push(points[i]);
    }
  }

  return changes;
}

// Helper function to recursively search for Cube elements
function findCubesRecursive(obj: Record<string, unknown>, depth: number = 0): unknown[] {
  if (depth > 5) return []; // Prevent infinite recursion
  
  const cubes: unknown[] = [];
  
  // Check if this object has Cube elements
  if (obj.Cube) {
    const cube = obj.Cube;
    if (Array.isArray(cube)) {
      cubes.push(...cube);
    } else {
      cubes.push(cube);
    }
  }
  if (obj.cube) {
    const cube = obj.cube;
    if (Array.isArray(cube)) {
      cubes.push(...cube);
    } else {
      cubes.push(cube);
    }
  }
  
  // Recursively search nested objects
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = findCubesRecursive(value as Record<string, unknown>, depth + 1);
      if (nested.length > 0) {
        cubes.push(...nested);
      }
    }
  }
  
  return cubes;
}

// Helper function to find observations in parsed XML (handles various structures)
function findObservations(parsed: unknown): unknown[] | null {
  if (!parsed || typeof parsed !== 'object') return null;

  const obj = parsed as Record<string, unknown>;

  // Structure 1: Envelope.Cube (direct Cube elements in Envelope)
  const envelope = obj.Envelope || obj.envelope;
  if (envelope && typeof envelope === 'object') {
    const env = envelope as Record<string, unknown>;
    
    // Check for Cube elements directly in Envelope
    const cube = env.Cube || env.cube;
    if (cube) {
      return Array.isArray(cube) ? cube : [cube];
    }

    // Recursively search for Cube elements in Envelope
    const recursiveCubes = findCubesRecursive(env);
    if (recursiveCubes.length > 0) {
      return recursiveCubes;
    }

    // Structure 2: Envelope.message.DataSet.Series.Obs (nested structure)
    const message = env.message || env.Message;
    if (message && typeof message === 'object') {
      const msg = message as Record<string, unknown>;
      const dataset = msg.DataSet || msg.dataset || msg['DataSet'] || msg['dataSet'];
      if (dataset && typeof dataset === 'object') {
        const ds = dataset as Record<string, unknown>;
        const series = ds.Series || ds.series || ds['Series'] || ds['series'];
        if (series && typeof series === 'object') {
          const ser = series as Record<string, unknown>;
          const obs = ser.Obs || ser.obs || ser['Obs'] || ser['obs'];
          if (obs) {
            return Array.isArray(obs) ? obs : [obs];
          }
        }
      }
    }
  }

  // Structure 3: Direct Cube array (flattened structure)
  if (obj.Cube && Array.isArray(obj.Cube)) return obj.Cube as unknown[];
  if (obj.cube && Array.isArray(obj.cube)) return obj.cube as unknown[];

  // Last resort: recursive search from root
  const recursiveCubes = findCubesRecursive(obj);
  if (recursiveCubes.length > 0) {
    return recursiveCubes;
  }

  return null;
}

export async function GET() {
  try {
    const url =
      'https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?CodeVer=new&xml.x=yes&Datefrom=01/Jan/2000&Dateto=now&SeriesCodes=IUDBEDR';

    // Fetch with Next.js caching - revalidate every 6 hours
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 6 },
    });

    // Check if response is ok
    if (!response.ok) {
      console.error(`Bank of England API returned status ${response.status}: ${response.statusText}`);
      return NextResponse.json(
        { 
          error: `Failed to fetch data from Bank of England (Status: ${response.status})`,
          details: response.statusText 
        },
        { status: 502 }
      );
    }

    const xmlText = await response.text();

    // Defensive check: ensure we got XML, not HTML error page
    if (xmlText.startsWith('<!DOCTYPE html') || xmlText.includes('<html')) {
      console.error('Received HTML instead of XML. First 500 chars:', xmlText.substring(0, 500));
      return NextResponse.json(
        { error: 'Received HTML instead of XML from Bank of England' },
        { status: 502 }
      );
    }

    // Check if XML is empty or too short
    if (!xmlText || xmlText.trim().length < 100) {
      console.error('Received empty or very short XML response. Length:', xmlText.length);
      return NextResponse.json(
        { error: 'Received empty or invalid XML from Bank of England' },
        { status: 502 }
      );
    }

    // Parse XML with fast-xml-parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      trimValues: true,
    });

    let parsed: unknown;
    try {
      parsed = parser.parse(xmlText);
    } catch (parseError) {
      console.error('XML parsing failed:', parseError);
      console.error('XML preview (first 1000 chars):', xmlText.substring(0, 1000));
      return NextResponse.json(
        { 
          error: 'Failed to parse XML from Bank of England',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        },
        { status: 502 }
      );
    }

    // Log parsed structure keys for debugging (first level only)
    if (parsed && typeof parsed === 'object') {
      const topLevelKeys = Object.keys(parsed as Record<string, unknown>);
      console.log('Parsed XML top-level keys:', topLevelKeys);
    }

    // Find observations using flexible search
    const observations = findObservations(parsed);

    if (!observations || observations.length === 0) {
      // Log structure for debugging
      console.error('Could not find observations. Parsed structure:', JSON.stringify(parsed, null, 2).substring(0, 2000));
      return NextResponse.json(
        { 
          error: 'No observations found in the XML data',
          details: 'The XML structure may have changed. Check server logs for details.'
        },
        { status: 502 }
      );
    }

    // Debug: Log first observation structure
    if (observations.length > 0) {
      console.log('Found', observations.length, 'observations');
      console.log('First observation keys:', Object.keys(observations[0] as Record<string, unknown>));
      console.log('First observation sample:', JSON.stringify(observations[0], null, 2).substring(0, 500));
    }

    // Parse and sort data points
    const points = parseDataPoints(observations);

    if (points.length === 0) {
      console.error('No valid data points extracted from observations');
      console.error('Sample observation structure:', JSON.stringify(observations[0], null, 2).substring(0, 1000));
      return NextResponse.json(
        { error: 'No valid data points found after parsing observations' },
        { status: 502 }
      );
    }

    // Get changes only
    const changesOnly = getChangesOnly(points);

    // Get latest (last item in changesOnly)
    const latest = changesOnly.length > 0 ? changesOnly[changesOnly.length - 1] : null;

    const result: BankRateResponse = {
      seriesCode: 'IUDBEDR',
      points,
      changesOnly,
      latest,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching or parsing Bank of England data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error processing Bank of England data',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {})
      },
      { status: 500 }
    );
  }
}

