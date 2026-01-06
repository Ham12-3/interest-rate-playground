'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  monthlyPaymentAmortised,
  monthlyPaymentInterestOnly,
  savingsCompoundMonthly,
  savingsSimple,
} from '@/lib/finance';

type TabType = 'mortgage' | 'savings' | 'loan';
type ScenarioChange = -0.5 | -0.25 | 0 | 0.25 | 0.5;
type RepaymentType = 'repayment' | 'interest-only';
type SavingsMode = 'margin' | 'fixed';
type InterestType = 'simple' | 'compound';
type LoanMode = 'personal-loan' | 'credit-card';

interface MortgageInputs {
  loanAmount: string;
  termYears: string;
  repaymentType: RepaymentType;
  lenderMargin: string;
  currentFixedRate: string;
}

interface SavingsInputs {
  balance: string;
  savingsMode: SavingsMode;
  margin: string;
  fixedAPY: string;
  timeMonths: string;
  interestType: InterestType;
}

interface LoanInputs {
  mode: LoanMode;
  // Personal loan
  loanAmount: string;
  termYears: string;
  rateMode: 'margin' | 'fixed';
  margin: string;
  fixedAPR: string;
  // Credit card
  balance: string;
  apr: string;
  monthlyRepayment: string;
}

interface StoredInputs {
  scenarioChange: ScenarioChange;
  activeTab: TabType;
  mortgage: MortgageInputs;
  savings: SavingsInputs;
  loan: LoanInputs;
}

const STORAGE_KEY = 'bank-rate-calculator-inputs';

const defaultInputs: StoredInputs = {
  scenarioChange: 0,
  activeTab: 'mortgage',
  mortgage: {
    loanAmount: '250000',
    termYears: '25',
    repaymentType: 'repayment',
    lenderMargin: '1.50',
    currentFixedRate: '',
  },
  savings: {
    balance: '10000',
    savingsMode: 'margin',
    margin: '0.50',
    fixedAPY: '4.00',
    timeMonths: '12',
    interestType: 'compound',
  },
  loan: {
    mode: 'personal-loan',
    loanAmount: '10000',
    termYears: '5',
    rateMode: 'margin',
    margin: '3.00',
    fixedAPR: '8.00',
    balance: '5000',
    apr: '18.00',
    monthlyRepayment: '200',
  },
};

function PillButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 text-sm rounded-full transition font-medium',
        active
          ? 'bg-accent text-white shadow-sm'
          : 'bg-bg-card text-text-secondary hover:bg-accent-soft border border-border',
      ].join(' ')}
      type="button"
    >
      {children}
    </button>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

interface ImpactCalculatorsProps {
  latestRate: number;
}

export default function ImpactCalculators({ latestRate }: ImpactCalculatorsProps) {
  const [inputs, setInputs] = useState<StoredInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState<TabType>('mortgage');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setInputs(parsed);
        setActiveTab(parsed.activeTab || 'mortgage');
      }
    } catch (e) {
      // Ignore parse errors, use defaults
    }
  }, []);

  // Save to localStorage whenever inputs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...inputs, activeTab }));
    } catch (e) {
      // Ignore storage errors
    }
  }, [inputs, activeTab]);

  const baseRate = latestRate;
  const scenarioRate = latestRate + inputs.scenarioChange;

  const updateInputs = <K extends keyof StoredInputs>(
    key: K,
    value: StoredInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const updateMortgageInput = <K extends keyof MortgageInputs>(
    key: K,
    value: MortgageInputs[K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      mortgage: { ...prev.mortgage, [key]: value },
    }));
  };

  const updateSavingsInput = <K extends keyof SavingsInputs>(
    key: K,
    value: SavingsInputs[K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      savings: { ...prev.savings, [key]: value },
    }));
  };

  const updateLoanInput = <K extends keyof LoanInputs>(
    key: K,
    value: LoanInputs[K]
  ) => {
    setInputs((prev) => ({
      ...prev,
      loan: { ...prev.loan, [key]: value },
    }));
  };

  // Mortgage calculations
  const mortgageResults = useMemo(() => {
    const loanAmount = parseFloat(inputs.mortgage.loanAmount) || 0;
    const termYears = parseFloat(inputs.mortgage.termYears) || 0;
    const margin = parseFloat(inputs.mortgage.lenderMargin) || 0;
    const currentFixed = parseFloat(inputs.mortgage.currentFixedRate) || null;

    const effectiveRateNow = baseRate + margin;
    const effectiveRateScenario = scenarioRate + margin;

    const paymentNow =
      inputs.mortgage.repaymentType === 'repayment'
        ? monthlyPaymentAmortised(loanAmount, effectiveRateNow, termYears)
        : monthlyPaymentInterestOnly(loanAmount, effectiveRateNow);

    const paymentScenario =
      inputs.mortgage.repaymentType === 'repayment'
        ? monthlyPaymentAmortised(loanAmount, effectiveRateScenario, termYears)
        : monthlyPaymentInterestOnly(loanAmount, effectiveRateScenario);

    const paymentCurrentFixed =
      currentFixed !== null
        ? inputs.mortgage.repaymentType === 'repayment'
          ? monthlyPaymentAmortised(loanAmount, currentFixed, termYears)
          : monthlyPaymentInterestOnly(loanAmount, currentFixed)
        : null;

    return {
      effectiveRateNow,
      effectiveRateScenario,
      paymentNow,
      paymentScenario,
      difference: paymentScenario - paymentNow,
      paymentCurrentFixed,
    };
  }, [inputs.mortgage, baseRate, scenarioRate]);

  // Savings calculations
  const savingsResults = useMemo(() => {
    const balance = parseFloat(inputs.savings.balance) || 0;
    const months = parseFloat(inputs.savings.timeMonths) || 0;
    const annualRate =
      inputs.savings.savingsMode === 'margin'
        ? baseRate + (parseFloat(inputs.savings.margin) || 0)
        : parseFloat(inputs.savings.fixedAPY) || 0;
    const scenarioAnnualRate =
      inputs.savings.savingsMode === 'margin'
        ? scenarioRate + (parseFloat(inputs.savings.margin) || 0)
        : parseFloat(inputs.savings.fixedAPY) || 0;

    const finalBalanceNow =
      inputs.savings.interestType === 'compound'
        ? savingsCompoundMonthly(balance, annualRate, months)
        : savingsSimple(balance, annualRate, months);

    const finalBalanceScenario =
      inputs.savings.interestType === 'compound'
        ? savingsCompoundMonthly(balance, scenarioAnnualRate, months)
        : savingsSimple(balance, scenarioAnnualRate, months);

    const interestNow = finalBalanceNow - balance;
    const interestScenario = finalBalanceScenario - balance;

    return {
      annualRateNow: annualRate,
      annualRateScenario: scenarioAnnualRate,
      finalBalanceNow,
      finalBalanceScenario,
      interestNow,
      interestScenario,
      difference: finalBalanceScenario - finalBalanceNow,
    };
  }, [inputs.savings, baseRate, scenarioRate]);

  // Loan calculations
  const loanResults = useMemo(() => {
    if (inputs.loan.mode === 'personal-loan') {
      const loanAmount = parseFloat(inputs.loan.loanAmount) || 0;
      const termYears = parseFloat(inputs.loan.termYears) || 0;
      const annualRate =
        inputs.loan.rateMode === 'margin'
          ? baseRate + (parseFloat(inputs.loan.margin) || 0)
          : parseFloat(inputs.loan.fixedAPR) || 0;

      const monthlyPayment = monthlyPaymentAmortised(loanAmount, annualRate, termYears);
      const totalPaid = monthlyPayment * termYears * 12;
      const totalInterest = totalPaid - loanAmount;

      return {
        mode: 'personal-loan' as const,
        monthlyPayment,
        totalInterest,
        totalPaid,
        annualRate,
      };
    } else {
      // Credit card
      const balance = parseFloat(inputs.loan.balance) || 0;
      const apr = parseFloat(inputs.loan.apr) || 0;
      const monthlyRepayment = parseFloat(inputs.loan.monthlyRepayment) || 0;

      if (balance === 0 || monthlyRepayment === 0) {
        return { 
          mode: 'credit-card' as const,
          monthsToRepay: null, 
          totalInterest: 0, 
          willNotRepay: false 
        };
      }

      const monthlyRate = apr / 100 / 12;
      let currentBalance = balance;
      let totalInterest = 0;
      let months = 0;
      const maxMonths = 600;

      while (currentBalance > 0.01 && months < maxMonths) {
        const monthlyInterest = currentBalance * monthlyRate;
        totalInterest += monthlyInterest;

        if (monthlyRepayment <= monthlyInterest) {
          return { 
            mode: 'credit-card' as const,
            monthsToRepay: null, 
            totalInterest, 
            willNotRepay: true 
          };
        }

        currentBalance = currentBalance + monthlyInterest - monthlyRepayment;
        months++;
      }

      return {
        mode: 'credit-card' as const,
        monthsToRepay: months >= maxMonths ? null : months,
        totalInterest,
        willNotRepay: months >= maxMonths,
      };
    }
  }, [inputs.loan, baseRate]);

  return (
    <div className="bg-bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-sm mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          Impact calculators (estimates)
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Estimates only. Actual lender pricing varies.
        </p>

        {/* Scenario Control */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className="text-sm font-medium text-text-secondary">Bank Rate change:</span>
          {([-0.5, -0.25, 0, 0.25, 0.5] as ScenarioChange[]).map((change) => (
            <PillButton
              key={change}
              active={inputs.scenarioChange === change}
              onClick={() => updateInputs('scenarioChange', change)}
            >
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)}%
            </PillButton>
          ))}
        </div>

        {/* Rate Display */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-text-muted">Base Rate: </span>
            <span className="font-mono font-semibold text-text-primary">{baseRate.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-text-muted">Scenario Rate: </span>
            <span className="font-mono font-semibold text-text-primary">{scenarioRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {(['mortgage', 'savings', 'loan'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium transition border-b-2 -mb-px',
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tab === 'mortgage' ? 'Mortgage' : tab === 'savings' ? 'Savings' : 'Loan & Credit'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mortgage Tab */}
        {activeTab === 'mortgage' && (
          <>
            <div className="bg-accent-soft/30 rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Inputs</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Loan amount (GBP)
                  </label>
                  <input
                    type="number"
                    value={inputs.mortgage.loanAmount}
                    onChange={(e) => updateMortgageInput('loanAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Term (years)</label>
                  <input
                    type="number"
                    value={inputs.mortgage.termYears}
                    onChange={(e) => updateMortgageInput('termYears', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Repayment type
                  </label>
                  <div className="flex gap-2">
                    {(['repayment', 'interest-only'] as RepaymentType[]).map((type) => (
                      <PillButton
                        key={type}
                        active={inputs.mortgage.repaymentType === type}
                        onClick={() => updateMortgageInput('repaymentType', type)}
                      >
                        {type === 'repayment' ? 'Repayment' : 'Interest-only'}
                      </PillButton>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Lender margin (% points)
                  </label>
                  <input
                    type="number"
                    value={inputs.mortgage.lenderMargin}
                    onChange={(e) => updateMortgageInput('lenderMargin', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Current fixed rate (%) (optional)
                  </label>
                  <input
                    type="number"
                    value={inputs.mortgage.currentFixedRate}
                    onChange={(e) => updateMortgageInput('currentFixedRate', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                    step="0.01"
                    min="0"
                    placeholder="Leave empty if not applicable"
                  />
                </div>
              </div>
            </div>

            <div className="bg-accent-soft/30 rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Results</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-text-muted mb-1">Effective rate now</div>
                  <div className="text-2xl font-mono font-semibold text-text-primary">
                    {formatNumber(mortgageResults.effectiveRateNow)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Effective rate in scenario</div>
                  <div className="text-2xl font-mono font-semibold text-text-primary">
                    {formatNumber(mortgageResults.effectiveRateScenario)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Monthly payment now</div>
                  <div className="text-2xl font-mono font-semibold text-text-primary">
                    {formatCurrency(mortgageResults.paymentNow)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Monthly payment in scenario</div>
                  <div className="text-2xl font-mono font-semibold text-text-primary">
                    {formatCurrency(mortgageResults.paymentScenario)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Difference</div>
                  <div
                    className={[
                      'text-2xl font-mono font-semibold',
                      mortgageResults.difference >= 0 ? 'text-positive' : 'text-negative',
                    ].join(' ')}
                  >
                    {mortgageResults.difference >= 0 ? '+' : ''}
                    {formatCurrency(mortgageResults.difference)}
                  </div>
                </div>
                {mortgageResults.paymentCurrentFixed !== null && (
                  <div className="pt-4 border-t border-border">
                    <div className="text-xs text-text-muted mb-1">Current fixed monthly payment</div>
                    <div className="text-xl font-mono font-semibold text-text-primary">
                      {formatCurrency(mortgageResults.paymentCurrentFixed)}
                    </div>
                    <div className="text-xs text-text-muted mt-2">
                      vs. Estimated tracker: {formatCurrency(mortgageResults.paymentNow)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Savings Tab */}
        {activeTab === 'savings' && (
          <>
            <div className="bg-accent-soft/30 rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Inputs</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Balance (GBP)
                  </label>
                  <input
                    type="number"
                    value={inputs.savings.balance}
                    onChange={(e) => updateSavingsInput('balance', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Savings rate mode
                  </label>
                  <div className="flex gap-2">
                    {(['margin', 'fixed'] as SavingsMode[]).map((mode) => (
                      <PillButton
                        key={mode}
                        active={inputs.savings.savingsMode === mode}
                        onClick={() => updateSavingsInput('savingsMode', mode)}
                      >
                        {mode === 'margin' ? 'Bank Rate + margin' : 'Fixed APY'}
                      </PillButton>
                    ))}
                  </div>
                </div>
                {inputs.savings.savingsMode === 'margin' ? (
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Margin (% points)
                    </label>
                    <input
                      type="number"
                      value={inputs.savings.margin}
                      onChange={(e) => updateSavingsInput('margin', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                      step="0.01"
                      min="0"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Fixed APY (%)
                    </label>
                    <input
                      type="number"
                      value={inputs.savings.fixedAPY}
                      onChange={(e) => updateSavingsInput('fixedAPY', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Time period (months)
                  </label>
                  <input
                    type="number"
                    value={inputs.savings.timeMonths}
                    onChange={(e) => updateSavingsInput('timeMonths', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Interest type
                  </label>
                  <div className="flex gap-2">
                    {(['simple', 'compound'] as InterestType[]).map((type) => (
                      <PillButton
                        key={type}
                        active={inputs.savings.interestType === type}
                        onClick={() => updateSavingsInput('interestType', type)}
                      >
                        {type === 'compound' ? 'Compound monthly' : 'Simple'}
                      </PillButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-accent-soft/30 rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Results</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-text-muted mb-1">Annual rate used</div>
                  <div className="text-2xl font-mono font-semibold text-text-primary">
                    {formatNumber(savingsResults.annualRateNow)}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Interest (now)</div>
                    <div className="text-xl font-mono font-semibold text-text-primary">
                      {formatCurrency(savingsResults.interestNow)}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Final: {formatCurrency(savingsResults.finalBalanceNow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Interest (scenario)</div>
                    <div className="text-xl font-mono font-semibold text-text-primary">
                      {formatCurrency(savingsResults.interestScenario)}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Final: {formatCurrency(savingsResults.finalBalanceScenario)}
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="text-xs text-text-muted mb-1">Difference (scenario - now)</div>
                  <div
                    className={[
                      'text-2xl font-mono font-semibold',
                      savingsResults.difference >= 0 ? 'text-positive' : 'text-negative',
                    ].join(' ')}
                  >
                    {savingsResults.difference >= 0 ? '+' : ''}
                    {formatCurrency(savingsResults.difference)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loan & Credit Tab */}
        {activeTab === 'loan' && (
          <>
            <div className="bg-accent-soft/30 rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Inputs</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Mode</label>
                  <div className="flex gap-2">
                    {(['personal-loan', 'credit-card'] as LoanMode[]).map((mode) => (
                      <PillButton
                        key={mode}
                        active={inputs.loan.mode === mode}
                        onClick={() => updateLoanInput('mode', mode)}
                      >
                        {mode === 'personal-loan' ? 'Personal loan' : 'Credit card'}
                      </PillButton>
                    ))}
                  </div>
                </div>

                {inputs.loan.mode === 'personal-loan' ? (
                  <>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        Loan amount (GBP)
                      </label>
                      <input
                        type="number"
                        value={inputs.loan.loanAmount}
                        onChange={(e) => updateLoanInput('loanAmount', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        Term (years)
                      </label>
                      <input
                        type="number"
                        value={inputs.loan.termYears}
                        onChange={(e) => updateLoanInput('termYears', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        Rate mode
                      </label>
                      <div className="flex gap-2">
                        {(['margin', 'fixed'] as const).map((mode) => (
                          <PillButton
                            key={mode}
                            active={inputs.loan.rateMode === mode}
                            onClick={() => updateLoanInput('rateMode', mode)}
                          >
                            {mode === 'margin' ? 'Bank Rate + margin' : 'Fixed APR'}
                          </PillButton>
                        ))}
                      </div>
                    </div>
                    {inputs.loan.rateMode === 'margin' ? (
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Margin (% points)
                        </label>
                        <input
                          type="number"
                          value={inputs.loan.margin}
                          onChange={(e) => updateLoanInput('margin', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Fixed APR (%)
                        </label>
                        <input
                          type="number"
                          value={inputs.loan.fixedAPR}
                          onChange={(e) => updateLoanInput('fixedAPR', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        Balance (GBP)
                      </label>
                      <input
                        type="number"
                        value={inputs.loan.balance}
                        onChange={(e) => updateLoanInput('balance', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        APR (%)
                      </label>
                      <input
                        type="number"
                        value={inputs.loan.apr}
                        onChange={(e) => updateLoanInput('apr', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">
                        Monthly repayment (GBP)
                      </label>
                      <input
                        type="number"
                        value={inputs.loan.monthlyRepayment}
                        onChange={(e) => updateLoanInput('monthlyRepayment', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-bg-card"
                        min="0"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-accent-soft/30 rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Results</h3>
              <div className="space-y-4">
                {loanResults.mode === 'personal-loan' ? (
                  <>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Annual rate</div>
                      <div className="text-2xl font-mono font-semibold text-text-primary">
                        {formatNumber(loanResults.annualRate)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Monthly payment</div>
                      <div className="text-2xl font-mono font-semibold text-text-primary">
                        {formatCurrency(loanResults.monthlyPayment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Total interest</div>
                      <div className="text-2xl font-mono font-semibold text-text-primary">
                        {formatCurrency(loanResults.totalInterest)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Total paid</div>
                      <div className="text-xl font-mono font-semibold text-text-primary">
                        {formatCurrency(loanResults.totalPaid)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {loanResults.willNotRepay ? (
                      <div>
                        <div className="text-xs text-text-muted mb-1">Status</div>
                        <div className="text-xl font-semibold text-negative">
                          Will not repay
                        </div>
                        <div className="text-xs text-text-muted mt-2">
                          Monthly repayment is less than or equal to monthly interest
                        </div>
                      </div>
                    ) : loanResults.monthsToRepay === null ? (
                      <div>
                        <div className="text-xs text-text-muted mb-1">Status</div>
                        <div className="text-xl font-semibold text-warning">
                          Exceeds maximum simulation period (50 years)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-text-muted mb-1">Months to repay</div>
                        <div className="text-2xl font-mono font-semibold text-text-primary">
                          {loanResults.monthsToRepay}
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          ({formatNumber(loanResults.monthsToRepay / 12, 1)} years)
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-text-muted mb-1">Total interest paid (estimate)</div>
                      <div className="text-2xl font-mono font-semibold text-text-primary">
                        {formatCurrency(loanResults.totalInterest)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

