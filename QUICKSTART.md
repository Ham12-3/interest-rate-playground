# Quick Start Guide

## Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## What Was Built

### 1. API Route (`/api/boe/bank-rate`)
- Fetches Bank of England XML data for Official Bank Rate (IUDBEDR)
- Parses XML using fast-xml-parser
- Caches data for 6 hours using Next.js fetch caching
- Returns structured JSON with:
  - All data points (sorted and de-duplicated)
  - Changes only (points where rate differs from previous)
  - Latest rate

### 2. Bank Rate Dashboard (`/bank-rate`)
- Client component that fetches from the API route
- Displays latest rate in a prominent card
- Shows interactive line chart of rate changes using Recharts
- Includes loading and error states
- Fully responsive with Tailwind CSS

### 3. Home Page (`/`)
- Landing page with project description
- Navigation link to Bank Rate Dashboard
- Modern, attractive UI with gradient background

## File Structure

```
interest-rate-playground/
├── src/
│   └── app/
│       ├── api/
│       │   └── boe/
│       │       └── bank-rate/
│       │           └── route.ts          # API endpoint
│       ├── bank-rate/
│       │   └── page.tsx                  # Dashboard page
│       ├── page.tsx                      # Home page
│       ├── layout.tsx                    # Root layout
│       └── globals.css                   # Global styles
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
├── next.config.ts                        # Next.js config
└── README.md                             # Documentation
```

## Testing the Application

### 1. Test the API Route
Visit: http://localhost:3000/api/boe/bank-rate

You should see JSON output with:
- `seriesCode`: "IUDBEDR"
- `points`: Array of all data points
- `changesOnly`: Array of rate changes
- `latest`: Most recent rate value

### 2. Test the Dashboard
Visit: http://localhost:3000/bank-rate

You should see:
- Current Bank Rate displayed prominently
- Interactive line chart showing historical changes
- Smooth loading state with spinner
- Error handling if data fetch fails

### 3. Test the Home Page
Visit: http://localhost:3000

You should see:
- Welcome message and description
- Button to navigate to Bank Rate Dashboard

## Key Features

✅ **Server-side caching** - Data cached for 6 hours  
✅ **Error handling** - Defensive checks for HTML responses and malformed XML  
✅ **Data parsing** - Supports both element and attribute XML forms  
✅ **De-duplication** - Removes duplicate dates  
✅ **Change detection** - Filters to only show rate changes  
✅ **Modern UI** - Tailwind CSS with dark mode support  
✅ **Type safety** - Full TypeScript coverage  
✅ **Responsive** - Works on all screen sizes  

## Troubleshooting

If you encounter issues:

1. **Port already in use**: The default port is 3000. If needed, use: `npm run dev -- -p 3001`
2. **Dependencies not installed**: Run `npm install`
3. **Build errors**: Ensure you're using Node.js 18+ (`node --version`)
4. **Data not loading**: Check your internet connection (API fetches from Bank of England)

## Next Steps

Feel free to customize:
- Update colors in `tailwind.config.ts`
- Modify chart appearance in `src/app/bank-rate/page.tsx`
- Adjust caching duration in `src/app/api/boe/bank-rate/route.ts`
- Add more series codes or data sources

