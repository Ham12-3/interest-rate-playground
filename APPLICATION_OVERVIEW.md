# Interest Rate Playground - Complete Application Overview

## 🎯 What This Application Does

This is a **comprehensive financial web application** that fetches, visualizes, and helps users understand the impact of the Bank of England's Official Bank Rate on their personal finances. It combines real-time data visualization with practical financial calculators.

---

## 📊 Core Features

### 1. **Real-Time Bank Rate Data Fetching**

**What it does:**
- Fetches the latest Bank of England Official Bank Rate (series code: IUDBEDR) from 2000 to present
- Retrieves data from the official Bank of England Statistical Database API
- Parses XML data and converts it to JSON format
- Caches data for 6 hours to reduce API calls and improve performance

**How it works:**
- Server-side API route at `/api/boe/bank-rate`
- Uses Next.js fetch caching with 6-hour revalidation
- Handles XML parsing with `fast-xml-parser`
- De-duplicates and sorts data chronologically
- Identifies rate changes (only shows points where the rate actually changed)

**Data returned:**
```json
{
  "seriesCode": "IUDBEDR",
  "points": [...],           // All data points
  "changesOnly": [...],      // Only rate changes
  "latest": {                // Most recent rate
    "date": "2024-01-01",
    "value": 5.25
  }
}
```

---

### 2. **Interactive Historical Chart Visualization**

**What it does:**
- Displays an interactive line chart showing Bank Rate changes over time
- Uses Recharts library for smooth, responsive visualizations
- Shows only rate changes (not every data point) for cleaner visualization
- Provides hover tooltips with exact dates and values
- Includes a vertical crosshair cursor for precise data inspection

**Features:**
- **Time Range Filters:** View data for 1M, 6M, 1Y, 5Y, or ALL time
- **Dynamic Stats Header:** Shows current rate, percentage change, and date range
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Clean UI:** Minimal design with professional styling

**Chart Interactions:**
- Hover over the line to see exact date and rate value
- Click time range buttons (1M, 6M, 1Y, 5Y, ALL) to filter data
- Automatic Y-axis scaling based on selected range

---

### 3. **Impact Calculators (Financial Planning Tools)**

This is the **most powerful feature** - three comprehensive calculators that help users understand how Bank Rate changes affect their finances.

#### **A. Mortgage Impact Calculator**

**What it calculates:**
- How Bank Rate changes affect mortgage payments
- Comparison between current fixed rates and new tracker rates
- Monthly payment differences under different scenarios

**Inputs:**
- Loan amount (GBP)
- Term (years)
- Repayment type (Repayment or Interest-only)
- Lender margin (percentage points above Bank Rate)
- Optional: Current fixed rate for comparison

**Outputs:**
- Effective rate now (Bank Rate + margin)
- Effective rate in scenario (Bank Rate + change + margin)
- Monthly payment now
- Monthly payment in scenario
- Difference (how much more/less you'd pay)
- Comparison with current fixed rate (if provided)

**Use case:** "If the Bank Rate goes up by 0.25%, how much more will my mortgage cost?"

---

#### **B. Savings Impact Calculator**

**What it calculates:**
- How much interest you'll earn on savings
- Impact of Bank Rate changes on savings returns
- Simple vs compound interest calculations

**Inputs:**
- Balance (GBP)
- Savings rate mode:
  - **Option 1:** Bank Rate + margin (e.g., Bank Rate + 0.50%)
  - **Option 2:** Fixed APY (e.g., 4.00%)
- Time period (months)
- Interest type: Simple or Compound monthly

**Outputs:**
- Annual rate used
- Interest earned (now vs scenario)
- Final balance (now vs scenario)
- Difference (how much more/less you'd earn)

**Use case:** "If the Bank Rate increases by 0.50%, how much more interest will I earn on my £10,000 savings over 12 months?"

---

#### **C. Loan & Credit Impact Calculator**

**Two modes:**

**1. Personal Loan Mode:**
- Calculates monthly payments and total interest
- Supports Bank Rate + margin OR fixed APR
- Shows total amount paid over loan term

**Inputs:**
- Loan amount
- Term (years)
- Rate mode (Bank Rate + margin OR fixed APR)
- Margin or fixed APR value

**Outputs:**
- Annual rate
- Monthly payment
- Total interest paid
- Total amount paid

**2. Credit Card Mode:**
- Simulates credit card repayment timeline
- Calculates how long it takes to pay off
- Estimates total interest paid

**Inputs:**
- Balance (GBP)
- APR (%)
- Monthly repayment amount

**Outputs:**
- Months to repay (or "will not repay" if payment too low)
- Total interest paid (estimate)
- Warns if monthly payment is less than monthly interest

**Use case:** "If I pay £200/month on my £5,000 credit card at 18% APR, how long will it take to pay off?"

---

### 4. **Scenario Planning**

**What it does:**
- Allows users to simulate different Bank Rate change scenarios
- Shows impact of rate changes BEFORE they happen

**Scenario Options:**
- -0.50% (rate cut)
- -0.25% (small cut)
- 0% (no change - current rate)
- +0.25% (small increase)
- +0.50% (larger increase)

**How it works:**
- Base Rate = Current Bank Rate
- Scenario Rate = Base Rate + Selected Change
- All calculators show results for both "now" and "scenario"
- Users can see the difference between current and potential future rates

**Use case:** "What if the Bank Rate increases by 0.25%? How would that affect my mortgage, savings, and loans?"

---

### 5. **Data Persistence**

**What it does:**
- Saves all calculator inputs to browser localStorage
- Remembers user's selected scenario and active tab
- Preserves data across page refreshes

**Benefits:**
- Users don't lose their inputs if they refresh the page
- Can bookmark and return to their calculations
- No need to re-enter data every time

---

## 🎨 User Interface & Design

### **Visual Design:**
- **Hero Section:** Large display of current Bank Rate with background image
- **Main Content:** Clean white cards with subtle borders and shadows
- **Footer:** Attribution and data source information
- **Typography:** 
  - Inter font for UI text
  - JetBrains Mono for numbers (rates, percentages) for precision
- **Color Scheme:**
  - Professional slate colors for text
  - Blue accent color for interactive elements
  - Green/Red for positive/negative changes

### **Responsive Layout:**
- Desktop: Two-column layout for calculators (inputs left, results right)
- Mobile: Stacked single-column layout
- Tablet: Adaptive layout

---

## 🔧 Technical Architecture

### **Frontend:**
- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Chart visualization
- **React Hooks** - State management (useState, useEffect, useMemo)

### **Backend:**
- **Next.js API Routes** - Server-side data fetching
- **fast-xml-parser** - XML to JSON conversion
- **Next.js Fetch Caching** - 6-hour cache for performance

### **Data Flow:**
```
User visits page
    ↓
Client component mounts
    ↓
Fetches from /api/boe/bank-rate
    ↓
API route checks cache (6 hours)
    ↓
If cache miss: Fetches from Bank of England API
    ↓
Parses XML → Processes → Returns JSON
    ↓
Client receives data
    ↓
Displays chart + calculators
```

---

## 📈 Financial Calculations

### **Mortgage Calculations:**
- **Amortised (Repayment):** Uses standard amortization formula
- **Interest-Only:** Simple monthly interest calculation
- Handles edge cases (zero rates, invalid inputs)

### **Savings Calculations:**
- **Compound Interest:** Monthly compounding formula
- **Simple Interest:** Linear interest calculation
- Accurate to 2 decimal places

### **Loan Calculations:**
- **Personal Loans:** Full amortization schedule
- **Credit Cards:** Month-by-month simulation (up to 50 years)
- Detects if repayment is insufficient

---

## 🎯 Use Cases

### **For Homeowners:**
- Understand how rate changes affect mortgage payments
- Compare fixed vs tracker rates
- Plan for potential rate increases

### **For Savers:**
- See how rate changes impact savings returns
- Compare simple vs compound interest
- Plan savings strategy

### **For Borrowers:**
- Calculate loan payments
- Understand credit card repayment timelines
- See total interest costs

### **For Financial Planners:**
- Educate clients about rate impacts
- Show scenario planning
- Visualize historical rate trends

---

## 🔒 Security & Privacy

- **No user data stored** - All calculations are client-side
- **No authentication required** - Public data only
- **No API keys** - Uses public Bank of England API
- **LocalStorage only** - Data stays in user's browser
- **No tracking** - Privacy-focused

---

## 📱 Features Summary

✅ Real-time Bank Rate data (2000-present)  
✅ Interactive historical chart with time filters  
✅ Mortgage impact calculator  
✅ Savings impact calculator  
✅ Loan & credit calculator (personal loans + credit cards)  
✅ Scenario planning (simulate rate changes)  
✅ Data persistence (localStorage)  
✅ Responsive design (mobile, tablet, desktop)  
✅ Professional UI with modern typography  
✅ Server-side caching for performance  
✅ Type-safe TypeScript code  
✅ Error handling and loading states  

---

## 🚀 Getting Started

1. **View Current Rate:** See the latest Bank Rate in the hero section
2. **Explore History:** Use the chart to see rate changes over time
3. **Calculate Impact:** Use the calculators to see how rates affect you
4. **Plan Scenarios:** Test different rate change scenarios
5. **Save Your Work:** Inputs are automatically saved in your browser

---

## 💡 Key Benefits

- **Educational:** Helps users understand how interest rates work
- **Practical:** Real calculations based on actual Bank Rate data
- **Interactive:** Visual charts and instant calculations
- **Comprehensive:** Covers mortgages, savings, and loans
- **Future-Proof:** Scenario planning for potential rate changes
- **User-Friendly:** Clean interface, no learning curve

---

This application is a **complete financial planning tool** that makes the Bank of England's interest rate data accessible and actionable for everyday users.

