/**
 * Financial calculation utilities
 * All rates are in percentage (e.g., 5.0 for 5%)
 * All amounts are in the same currency unit (e.g., GBP)
 */

/**
 * Calculate monthly payment for an amortised loan (principal + interest)
 * Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
 * where P = principal, r = monthly rate, n = number of months
 * 
 * @param principal - Loan amount
 * @param annualRatePct - Annual interest rate as percentage (e.g., 5.0 for 5%)
 * @param years - Loan term in years
 * @returns Monthly payment amount
 */
export function monthlyPaymentAmortised(
  principal: number,
  annualRatePct: number,
  years: number
): number {
  // Input guarding
  if (principal < 0 || annualRatePct < 0 || years < 0) {
    return 0;
  }
  if (isNaN(principal) || isNaN(annualRatePct) || isNaN(years)) {
    return 0;
  }
  if (principal === 0 || years === 0) {
    return 0;
  }

  // Handle zero rate case
  if (annualRatePct === 0) {
    return principal / (years * 12);
  }

  const monthlyRate = annualRatePct / 100 / 12;
  const numMonths = years * 12;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, numMonths);
  const denominator = Math.pow(1 + monthlyRate, numMonths) - 1;

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Calculate monthly payment for an interest-only loan
 * Formula: P * r
 * where P = principal, r = monthly rate
 * 
 * @param principal - Loan amount
 * @param annualRatePct - Annual interest rate as percentage (e.g., 5.0 for 5%)
 * @returns Monthly payment amount
 */
export function monthlyPaymentInterestOnly(
  principal: number,
  annualRatePct: number
): number {
  // Input guarding
  if (principal < 0 || annualRatePct < 0) {
    return 0;
  }
  if (isNaN(principal) || isNaN(annualRatePct)) {
    return 0;
  }
  if (principal === 0) {
    return 0;
  }

  const monthlyRate = annualRatePct / 100 / 12;
  return principal * monthlyRate;
}

/**
 * Calculate compound interest savings (monthly compounding)
 * Formula: P * (1 + r)^n
 * where P = principal, r = monthly rate, n = number of months
 * 
 * @param balance - Initial balance
 * @param annualRatePct - Annual interest rate as percentage (e.g., 4.0 for 4%)
 * @param months - Number of months
 * @returns Final balance after compound interest
 */
export function savingsCompoundMonthly(
  balance: number,
  annualRatePct: number,
  months: number
): number {
  // Input guarding
  if (balance < 0 || annualRatePct < 0 || months < 0) {
    return balance;
  }
  if (isNaN(balance) || isNaN(annualRatePct) || isNaN(months)) {
    return balance;
  }
  if (months === 0) {
    return balance;
  }

  const monthlyRate = annualRatePct / 100 / 12;
  return balance * Math.pow(1 + monthlyRate, months);
}

/**
 * Calculate simple interest savings (no compounding)
 * Formula: P * (1 + r * n)
 * where P = principal, r = monthly rate, n = number of months
 * 
 * @param balance - Initial balance
 * @param annualRatePct - Annual interest rate as percentage (e.g., 4.0 for 4%)
 * @param months - Number of months
 * @returns Final balance after simple interest
 */
export function savingsSimple(
  balance: number,
  annualRatePct: number,
  months: number
): number {
  // Input guarding
  if (balance < 0 || annualRatePct < 0 || months < 0) {
    return balance;
  }
  if (isNaN(balance) || isNaN(annualRatePct) || isNaN(months)) {
    return balance;
  }
  if (months === 0) {
    return balance;
  }

  const monthlyRate = annualRatePct / 100 / 12;
  return balance * (1 + monthlyRate * months);
}

