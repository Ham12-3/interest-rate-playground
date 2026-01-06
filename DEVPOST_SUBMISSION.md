# Devpost Submission Content

## Project Story (About the project)

```markdown
## Inspiration

The Bank of England's interest rate decisions directly impact millions of people's finances, yet understanding how these changes affect mortgages, savings, and loans can be complex. We wanted to create a tool that makes this data accessible, visual, and actionable for everyday users.

Many people struggle to understand:
- How will a 0.25% rate increase affect my mortgage payment?
- What's the difference between my current fixed rate and a new tracker rate?
- How much more interest will I earn if rates go up?
- How long will it take to pay off my credit card?

We built **Interest Rate Playground** to answer these questions with real-time data and practical calculators.

## What We Learned

Building this project taught us:
- **XML Parsing Complexity**: The Bank of England API returns complex nested XML structures. We learned to build flexible parsers that handle various data formats.
- **Financial Calculations**: Implementing accurate mortgage amortization, compound interest, and credit card repayment simulations required deep understanding of financial formulas.
- **State Management**: Managing complex calculator inputs with localStorage persistence while maintaining React's Rules of Hooks was a valuable learning experience.
- **Data Visualization**: Creating clean, interactive charts that show only meaningful data points (rate changes) rather than every data point improved user experience significantly.

## How We Built It

### Architecture
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for interactive data visualization
- **Data Processing**: Server-side API routes with Next.js fetch caching (6-hour revalidation)
- **XML Parsing**: fast-xml-parser for converting Bank of England XML to JSON

### Key Features

1. **Real-Time Data Fetching**
   - Server-side API route fetches from Bank of England Statistical Database
   - Parses XML and converts to structured JSON
   - Caches data for performance (6-hour revalidation)
   - Handles edge cases and error scenarios

2. **Interactive Historical Chart**
   - Visualizes rate changes from 2000 to present
   - Time range filters (1M, 6M, 1Y, 5Y, ALL)
   - Hover tooltips with exact dates and values
   - Shows only rate changes for cleaner visualization

3. **Impact Calculators**
   - **Mortgage Calculator**: Calculates payment changes, compares fixed vs tracker rates
   - **Savings Calculator**: Simple and compound interest calculations with rate change scenarios
   - **Loan & Credit Calculator**: Personal loan payments and credit card repayment simulations

4. **Scenario Planning**
   - Simulate rate changes (-0.50% to +0.50%)
   - Compare "now" vs "scenario" side-by-side
   - See financial impact before rate changes happen

5. **Data Persistence**
   - localStorage saves all calculator inputs
   - Remembers user preferences across sessions

### Technical Challenges

**Challenge 1: XML Structure Variability**
The Bank of England XML structure wasn't consistent. We built a flexible parser that:
- Recursively searches for data points
- Handles multiple XML structures
- Extracts data from both element and attribute forms
- Provides detailed error logging for debugging

**Challenge 2: React Hooks Order**
Initially, we had `useMemo` hooks conditionally called inside JSX, violating React's Rules of Hooks. We fixed this by:
- Moving all hooks to the top level of components
- Ensuring hooks are always called in the same order
- Using proper dependency arrays

**Challenge 3: Financial Calculation Accuracy**
Ensuring accurate calculations required:
- Proper handling of edge cases (zero rates, invalid inputs)
- Correct amortization formulas
- Accurate compound interest calculations
- Month-by-month credit card simulation

## Challenges We Faced

1. **Build Cache Issues**: Next.js `.next` directory corruption during development required cache clearing
2. **Missing Dependencies**: Deployment failed initially due to missing `autoprefixer` dependency
3. **Type Safety**: Complex calculator state required careful TypeScript typing with discriminated unions
4. **Performance**: Large datasets (2000+ data points) required memoization and efficient filtering

## Impact

This tool helps users:
- **Make Informed Decisions**: Understand how rate changes affect their finances
- **Plan Ahead**: Simulate different scenarios before rate changes happen
- **Save Money**: Compare mortgage options and optimize savings strategies
- **Educate Themselves**: Learn about interest rates through interactive visualizations

## Future Enhancements

- Add more calculator types (car loans, student loans)
- Historical comparison tools
- Export calculations to PDF
- Mobile app version
- Email alerts for rate changes
```

## Built With

```
Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, fast-xml-parser, PostCSS, Autoprefixer, Vercel
```

**Detailed breakdown:**
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Parsing**: fast-xml-parser
- **Deployment**: Vercel
- **Fonts**: Inter, JetBrains Mono (via next/font/google)
- **API**: Bank of England Statistical Database

## Try It Out Links

**Live Demo:**
```
https://your-vercel-app.vercel.app
```

**GitHub Repository:**
```
https://github.com/Ham12-3/interest-rate-playground
```

## Project Media Suggestions

**Recommended Images (3:2 ratio):**
1. **Hero Screenshot**: Main page showing the chart and latest rate
2. **Calculator View**: Screenshot of one of the calculators (mortgage/savings/loan)
3. **Mobile View**: Responsive design on mobile device
4. **Chart Interaction**: Hover tooltip showing on the chart

**Image Tips:**
- Use 3:2 aspect ratio (e.g., 1200x800px)
- Keep file sizes under 5MB
- Show the actual application, not just mockups
- Highlight key features (chart, calculators, scenario planning)

## Video Demo (Optional)

If creating a video demo, cover:
1. **Introduction** (0:00-0:15): What the app does
2. **Data Visualization** (0:15-0:45): Show the chart, time filters, hover interactions
3. **Mortgage Calculator** (0:45-1:30): Enter mortgage details, show scenario planning
4. **Savings Calculator** (1:30-2:00): Calculate interest with rate changes
5. **Loan Calculator** (2:00-2:30): Show credit card repayment simulation
6. **Conclusion** (2:30-2:45): Key benefits and impact

**Video Tips:**
- Keep it under 3 minutes
- Show real interactions, not just slides
- Highlight the scenario planning feature
- Show both desktop and mobile views if possible

