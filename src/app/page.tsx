"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Separator } from "@/components/ui/separator";
import CurrencyInput from "../components/CurrencyInput";
import formatCurrency from "../utils/formatCurrency";
import { ChevronDown } from 'lucide-react';

interface CalculationResult {
  maxPrice: number;
  loanAmount: number;
  mortgagePayment: number;
  monthlyInsurance: number;
  hoaFees: number;
  totalPITI: number;
  annualIncome: number;
}

interface WealthCalculatorResult {
  capital: number[];
  years: number;
}

const HouseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-12 h-12 text-blue-500"
    fill="currentColor"
  >
    <path d="M23 9.99V22h-8v-6h-6v6H1V9.99l11-9 11 9zM12 14c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z" />
  </svg>
);

const PiggyBankIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-8 h-8 text-blue-500"
    fill="currentColor"
  >
    <path d="M19.83 7.5l-2.27-2.27c.07-.42.18-.81.32-1.15.1-.24.22-.46.35-.67L18.97 2l-1.41-1.41-1.41 1.41c-.21.13-.43.25-.67.35-.34.14-.73.25-1.15.32L12.5 4.17 16 7.67l-.33.33h-.02L12 4.35 8.02 8h-.01L7.67 8.33l3.5-3.5L9.5 3.17c-.42.07-.81.18-1.15.32-.24.1-.46.22-.67.35L6.27 2.44 4.86 3.85l1.41 1.41c.13.21.25.43.35.67.14.34.25.73.32 1.15L4.17 9.5l3.5 3.5-3.5 3.5 2.27 2.27c-.07.42-.18.81-.32 1.15-.1.24-.22.46-.35.67l-1.41 1.41 1.41 1.41 1.41-1.41c.21-.13.43-.25.67-.35.34-.14.73-.25 1.15-.32l2.27-2.27L8 16.33l3.67-3.67L8.33 8l3.67-3.67L16.33 8l-3.67 3.67 3.67 3.67-3.5 3.5 2.27 2.27c.42-.07.81-.18 1.15-.32.24-.1.46-.22.67-.35l1.41 1.41 1.41-1.41-1.41-1.41c-.13-.21-.25-.43-.35-.67-.14-.34-.25-.73-.32-1.15l-2.27-2.27 3.5-3.5-3.5-3.5 3.5-3.5z"/>
  </svg>
);

const formatPercent = (value: number) => {
  return value.toLocaleString('sl-SI', { 
    minimumFractionDigits: 1,
    maximumFractionDigits: 1 
  }) + ' %';
};

const formatNumber = (value: number) => {
  return value.toLocaleString('sl-SI', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });
};

export default function Home() {
  const [formData, setFormData] = useState({
    income: 1500,
    downPayment: 50000,
    monthlyDebt: 100,
    interestRate: 3,
    loanTerm: 20,
    insuranceRate: 0.2,
    hoaFees: 0,
  });

  const [wealthData, setWealthData] = useState({
    currentCapital: 10000,
    monthlyIncome: 1500,
    investmentPercentage: 20,
    returnRate: 7,
    expenseRatio: 0.07,
    years: 20
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [wealthResult, setWealthResult] = useState<WealthCalculatorResult | null>(null);
  const [paymentAdjustment, setPaymentAdjustment] = useState(0); // -50 to +50 percent

  const getPaymentColor = (monthlyPayment: number, monthlyIncome: number) => {
    const ratio = (monthlyPayment / monthlyIncome) * 100;
    if (ratio <= 28) return "text-green-600";
    if (ratio <= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const calculateMonthlyPayments = (basePrice: number) => {
    const { downPayment, interestRate, loanTerm, insuranceRate, hoaFees } = formData;
    
    // Convert percentages to decimals
    const r = interestRate / 100;
    const i = insuranceRate / 100;

    // Calculate mortgage constant (m)
    const monthlyRate = r / 12;
    const totalPayments = loanTerm * 12;
    const m = monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments));

    const loanAmount = basePrice - downPayment;
    const mortgagePayment = m * loanAmount;
    const monthlyInsurance = (i * basePrice) / 12;
    const basePITI = mortgagePayment + monthlyInsurance + hoaFees;
    
    // Apply the adjustment to the total payment
    const adjustedPITI = basePITI * (1 + paymentAdjustment / 100);
    const adjustmentFactor = adjustedPITI / basePITI;

    return {
      mortgagePayment: mortgagePayment * adjustmentFactor,
      monthlyInsurance: monthlyInsurance * adjustmentFactor,
      hoaFees: hoaFees,
      totalPITI: adjustedPITI,
      maxPrice: basePrice * adjustmentFactor
    };
  };

  const handlePaymentSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAdjustment = parseFloat(e.target.value);
    setPaymentAdjustment(newAdjustment);
    
    if (result) {
      const basePrice = result.maxPrice / (1 + paymentAdjustment / 100);
      const payments = calculateMonthlyPayments(basePrice);
      
      setResult(prev => prev ? {
        ...prev,
        maxPrice: payments.maxPrice,
        mortgagePayment: payments.mortgagePayment,
        monthlyInsurance: payments.monthlyInsurance,
        hoaFees: payments.hoaFees,
        totalPITI: payments.totalPITI
      } : null);
    }
  };

  const handleChange = (name: string) => (value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleWealthChange = (name: string) => (value: number) => {
    setWealthData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWealthData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const calculateAffordability = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert monthly income to annual income for calculations
    const annualIncome = formData.income * 12;
    
    // Maximum monthly payment (33% of monthly income)
    const maxMonthlyPayment = (formData.income * 0.33) - formData.monthlyDebt;

    // Calculate maximum loan amount
    const monthlyInterestRate = formData.interestRate / 100 / 12;
    const numberOfPayments = formData.loanTerm * 12;

    const maxLoanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);

    // Add down payment to get maximum house price
    const maxPrice = maxLoanAmount + formData.downPayment;

    // Calculate monthly costs
    const loanAmount = maxPrice - formData.downPayment;
    const mortgagePayment = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    const monthlyInsurance = (maxPrice * (formData.insuranceRate / 100)) / 12;
    const hoaFees = formData.hoaFees;
    const totalPITI = mortgagePayment + monthlyInsurance + hoaFees;

    setResult({
      maxPrice,
      loanAmount,
      mortgagePayment,
      monthlyInsurance,
      hoaFees,
      totalPITI,
      annualIncome, // Add this to result
    });
  };

  const calculateWealth = (e: React.FormEvent) => {
    e.preventDefault();

    const monthlyInvestment = (wealthData.monthlyIncome * wealthData.investmentPercentage) / 100;
    const effectiveReturnRate = (wealthData.returnRate - wealthData.expenseRatio) / 100;
    const years = wealthData.years;
    
    const capital = new Array(years + 1).fill(0);
    capital[0] = wealthData.currentCapital;

    for (let year = 1; year <= years; year++) {
      capital[year] = (capital[year - 1] * (1 + effectiveReturnRate)) + (monthlyInvestment * 12);
    }

    setWealthResult({
      capital,
      years
    });
  };

  const calculateAdjustedPrice = (price: number) => {
    return price * (1 + paymentAdjustment / 100);
  };

  const calculateAdjustedPayment = (payment: number) => {
    return payment * (1 + paymentAdjustment / 100);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Kako naj rešim stanovanjski problem?</h1>
      <p>Orodje stanovanjski problem ponuja brezplačna orodja za izračunavanje potrebnih zneskov za nakup stanovanja.</p>
      <p className="mb-4">Z orodjem lahko izračunate, koliko stanovanja si lahko privoščite glede na vaš mesečni prihodek in prihranke ter kako lahko povečate svoje premoženje z vlaganjem.</p>
      <Tabs defaultValue="mortgage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mortgage">Kalkulator Kredita</TabsTrigger>
          <TabsTrigger value="wealth">Kalkulator premoženja</TabsTrigger>
        </TabsList>

        <TabsContent value="mortgage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Form */}
            <Card>
              <CardHeader>
                <CardTitle>Vnesi svoje prihodke</CardTitle>
                <CardDescription>Vnešenih podatkov, ne shranjujemo. Projekt je odprtokoden.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={calculateAffordability} className="space-y-4">
                  <div>
                    <label htmlFor="income" className="block text-sm font-medium">Mesečni prihodek</label>
                    <CurrencyInput 
                      id="income" 
                      name="income" 
                      value={formData.income} 
                      onChange={handleChange("income")} 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="downPayment" className="block text-sm font-medium">Prihranki (vključen polog)</label>
                    <CurrencyInput 
                      id="downPayment" 
                      name="downPayment" 
                      value={formData.downPayment} 
                      onChange={handleChange("downPayment")} 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="monthlyDebt" className="block text-sm font-medium">Trenutne mesečne obveznosti</label>
                    <CurrencyInput 
                      id="monthlyDebt" 
                      name="monthlyDebt" 
                      value={formData.monthlyDebt} 
                      onChange={handleChange("monthlyDebt")} 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="interestRate" className="block text-sm font-medium">Obrestna mera (%)</label>
                    <Input type="number" id="interestRate" name="interestRate" value={formData.interestRate} onChange={handleFormInputChange} step="0.1" min="0" max="20" required />
                  </div>
                  <div>
                    <label htmlFor="loanTerm" className="block text-sm font-medium">Trajanje kredita (let)</label>
                    <Input type="number" id="loanTerm" name="loanTerm" value={formData.loanTerm} onChange={handleFormInputChange} step="1" min="1" max="50" required />
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="flex w-full justify-between">
                        <span>Napredno</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-4 p-4">
                        <div className="space-y-2">
                          <label htmlFor="insuranceRate" className="block text-sm font-medium">Precent na za plačilo zavarovanja (%)</label>
                          <p className="text-sm text-muted-foreground">
                            Zavarovanje je obvezno in se giblje med 0.1% in 0.5% vrednosti nepremičnine letno.
                          </p>
                          <div className="relative">
                            <Input
                              type="number"
                              id="insuranceRate"
                              name="insuranceRate"
                              value={formData.insuranceRate}
                              onChange={handleFormInputChange}
                              step="0.1"
                              min="0.1"
                              max="0.5"
                              required
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                              %
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="hoaFees" className="block text-sm font-medium">Stanovanjski sklad</label>
                          <p className="text-sm text-muted-foreground">
                            Mesečni strošek stanovanjskega sklada. Običajno med 0€ in 200€.
                          </p>
                          <CurrencyInput 
                            id="hoaFees" 
                            name="hoaFees" 
                            value={formData.hoaFees} 
                            onChange={handleChange("hoaFees")} 
                            required 
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Button type="submit" className="w-full">Izračunaj</Button>
                </form>
              </CardContent>
            </Card>

            {/* Right Column: Results */}
            <Card>
              <CardHeader>
                <CardTitle>Rezultat</CardTitle>
              </CardHeader>
              <CardContent>
                {result && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">Privoščiš si lahko nepremičnino do:</h3>
                      <div className="text-3xl font-bold text-blue-600">{formatCurrency(calculateAdjustedPrice(result.maxPrice))}</div>
                      {Number(((calculateAdjustedPayment(result.totalPITI) / formData.income) * 100).toFixed(1)) <= 30 ? (
                        <p className="text-sm text-gray-500 mt-2">
                          Glede na vaše prihodke je izračunana vrednost smotrna.
                        </p>
                      ) : (
                        <p className="text-sm text-red-500 mt-2">
                          Opozorilo: Mesečni stroški presegajo {formatPercent(30)} vaših mesečnih prihodkov.
                        </p>
                      )}
                    </div>

                    <div className="relative py-8">
                      {/* Slider Bar */}
                      <div className="h-2 bg-blue-100 rounded-full">
                        <div 
                          className={`h-full rounded-full ${getPaymentColor(
                            calculateAdjustedPayment(result.totalPITI),
                            formData.income
                          )}`}
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                      
                      {/* Icons */}
                      <div className="absolute left-0 -top-4">
                        <PiggyBankIcon />
                      </div>
                      <div className="absolute right-0 -top-6">
                        <HouseIcon />
                      </div>
                      
                      {/* Monthly Payment Bubble */}
                      <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
                        <p className="text-sm font-semibold">
                          {formatCurrency(Math.round(calculateAdjustedPayment(result.totalPITI)))}
                        </p>
                      </div>

                      <div className="mt-4">
                        <label htmlFor="paymentSlider" className="block text-sm font-medium mb-2">
                          Prilagodi mesečno plačilo ({paymentAdjustment > 0 ? '+' : ''}{paymentAdjustment}%)
                        </label>
                        <input
                          type="range"
                          id="paymentSlider"
                          min="-50"
                          max="50"
                          value={paymentAdjustment}
                          onChange={handlePaymentSliderChange}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>14%</span>
                          <span>28%</span>
                          <span>42%</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">Mesečne obveznosti:</h3>
                          <ul className="list-none space-y-2">
                            <li className="flex justify-between">
                              <span>Kredit:</span>
                              <span>{formatCurrency(Math.round(calculateAdjustedPayment(result.mortgagePayment)))}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Zavarovanje:</span>
                              <span>{formatCurrency(Math.round(calculateAdjustedPayment(result.monthlyInsurance)))}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Stanovanjski sklad:</span>
                              <span>{formatCurrency(calculateAdjustedPayment(result.hoaFees))}</span>
                            </li>
                            <li className="flex justify-between font-semibold">
                              <span>Skupaj:</span>
                              <span>{formatCurrency(Math.round(calculateAdjustedPayment(result.totalPITI)))}</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <p className="font-semibold">v centru Ljubljane (4,687 €/m²):</p>
                          <p>Size: {(calculateAdjustedPrice(result.maxPrice) / 4687).toFixed(2)} m²</p>
                          <p>Type: {
                            (() => {
                              const size = calculateAdjustedPrice(result.maxPrice) / 4687;
                              return size < 40 ? "Garsoniera" : size < 64 ? "Eno sobno" : size < 90 ? "Dvo sobno" : "Tri ali več sobno";
                            })()
                          }</p>
                        </div>
                        <div>
                          <p className="font-semibold">v okolici Ljubljane (2,500 €/m²):</p>
                          <p>Size: {(calculateAdjustedPrice(result.maxPrice) / 2500).toFixed(2)} m²</p>
                          <p>Type: {
                            (() => {
                              const size = calculateAdjustedPrice(result.maxPrice) / 2500;
                              return size < 40 ? "Garsoniera" : size < 64 ? "Eno sobno" : size < 90 ? "Dvo sobno" : "Tri ali več sobno";
                            })()
                          }</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wealth">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Koliko lahko prihranim?</CardTitle>
                <CardDescription>Izračunajte rast svojega premoženja v naslednjih 20 letih.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={calculateWealth} className="space-y-4">
                  <div>
                    <label htmlFor="currentCapital" className="block text-sm font-medium">Trenutni kapital</label>
                    <CurrencyInput 
                      id="currentCapital" 
                      name="currentCapital" 
                      value={wealthData.currentCapital} 
                      onChange={handleWealthChange("currentCapital")} 
                      required 
                    />
                  </div>

                  <div>
                    <label htmlFor="monthlyIncome" className="block text-sm font-medium">Mesečni prihodek</label>
                    <CurrencyInput 
                      id="monthlyIncome" 
                      name="monthlyIncome" 
                      value={wealthData.monthlyIncome} 
                      onChange={handleWealthChange("monthlyIncome")} 
                      required 
                    />
                  </div>

                  <div>
                    <label htmlFor="investmentPercentage" className="block text-sm font-medium">Procent vlaganja</label>
                    <div className="relative">
                      <Input
                        type="number"
                        id="investmentPercentage"
                        name="investmentPercentage"
                        value={wealthData.investmentPercentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="1"
                        required
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        %
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="returnRate" className="block text-sm font-medium">
                      Pričakovana letna donosnost (%)
                      <p className="text-sm text-muted-foreground">
                        Povprečna letna donosnost S&P 500 je približno 7 %.
                      </p>
                    </label>
                    <Input
                      type="number"
                      id="returnRate"
                      name="returnRate"
                      value={wealthData.returnRate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.1"
                      required
                    />
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="flex items-center justify-between w-full">
                        <span>Napredno</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      <div>
                        <label htmlFor="expenseRatio" className="block text-sm font-medium">
                          Strošek sklada/indexa (%)
                          <p className="text-sm text-muted-foreground">
                            Letni strošek upravljanja sklada. Običajno med 0,03 % in 0,3 %.
                          </p>
                        </label>
                        <Input
                          type="number"
                          id="expenseRatio"
                          name="expenseRatio"
                          value={wealthData.expenseRatio}
                          onChange={handleInputChange}
                          min="0"
                          max="2"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="years" className="block text-sm font-medium">
                          Leta
                          <p className="text-sm text-muted-foreground">
                            Obdobje varčevanja v letih.
                          </p>
                        </label>
                        <Input
                          type="number"
                          id="years"
                          name="years"
                          value={wealthData.years}
                          onChange={handleInputChange}
                          min="1"
                          max="100"
                          step="1"
                          required
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Button type="submit" className="w-full">Izračunaj</Button>
                </form>
              </CardContent>
            </Card>

            {wealthResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Rezultati</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={Array.from({ length: wealthResult.years + 1 }, (_, year) => ({
                          year,
                          capital: wealthResult.capital[year]
                        }))}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          label={{ 
                            value: 'Leta', 
                            position: 'bottom',
                            offset: -10
                          }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value)}
                          label={{ 
                            value: 'Kapital (€)', 
                            angle: -90, 
                            position: 'left',
                            offset: 0
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Kapital']}
                          labelFormatter={(label: number) => `Leto ${formatNumber(label)}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="capital"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Začetni kapital:</span>
                      <span className="text-sm">{formatCurrency(wealthResult.capital[0])}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Končni kapital:</span>
                      <span className="text-sm font-semibold text-blue-600">{formatCurrency(wealthResult.capital[wealthData.years])}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mesečno vlaganje:</span>
                      <span className="text-sm">{formatCurrency((wealthData.monthlyIncome * wealthData.investmentPercentage) / 100)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Procent varčevanja:</span>
                      <span className="text-sm">{formatPercent(wealthData.investmentPercentage)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pričakovana donosnost:</span>
                      <span className="text-sm">{formatPercent(wealthData.returnRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Strošek sklada:</span>
                      <span className="text-sm">{formatPercent(wealthData.expenseRatio)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Skupni donos:</span>
                      <span className="text-sm">{formatCurrency(wealthResult.capital[wealthData.years] - wealthResult.capital[0] - ((wealthData.monthlyIncome * wealthData.investmentPercentage) / 100) * 12 * wealthData.years)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          To je začetna različica, ki lahko vsebuje napake ali netočnosti, zato priporočamo previdnost pri uporabi informacij.
        </div>
        <Separator className="my-4" />
        <div className="flex h-5 items-center space-x-4 text-sm justify-center">
          <a href="https://shape-labs.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            Made by Shape Labs
          </a>
          <Separator orientation="vertical" />
          <a href="https://obdavcen.si" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            Izračun davkov
          </a>
        </div>
      </div>
    </div>
  );
}