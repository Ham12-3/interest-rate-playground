# Interest Rate Playground

A Next.js application for exploring and visualizing Bank of England Official Bank Rate data.

## Features

- **Real-time Data**: Fetches latest Bank of England Official Bank Rate (series code IUDBEDR)
- **Historical Charts**: Interactive line chart showing rate changes over time using Recharts
- **Server-side Caching**: Data cached for 6 hours using Next.js fetch caching
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **TypeScript**: Fully typed for better development experience

## Getting Started

### Installation

1. Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build

To build for production:

```bash
npm run build
npm start
```

## API Route

### GET `/api/boe/bank-rate`

Returns Bank of England Official Bank Rate data in JSON format.

**Response:**

```json
{
  "seriesCode": "IUDBEDR",
  "points": [
    { "date": "2000-01-03", "value": 5.5 },
    ...
  ],
  "changesOnly": [
    { "date": "2000-01-03", "value": 5.5 },
    { "date": "2000-02-10", "value": 6.0 },
    ...
  ],
  "latest": { "date": "2024-01-01", "value": 5.25 }
}
```

- **points**: All data points (de-duplicated and sorted by date)
- **changesOnly**: Only data points where the rate changed from the previous value
- **latest**: The most recent rate change

## Pages

- **`/`**: Home page with navigation
- **`/bank-rate`**: Dashboard showing latest rate and historical chart

## Technology Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (for data visualization)
- **fast-xml-parser** (for parsing Bank of England XML data)

## Data Source

Data is fetched from the Bank of England Statistical Database:
- Series: Official Bank Rate (IUDBEDR)
- URL: https://www.bankofengland.co.uk/boeapps/database/

## License

MIT
