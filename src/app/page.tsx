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

interface CalculationResult {
  maxPrice: number;
  centralSize: number;
  centralType: string;
  suburbSize: number;
  suburbType: string;
  mortgagePayment: number;
  monthlyInsurance: number;
  hoaFees: number;
  totalPITI: number;
  maxPITI: number;
  totalDebt: number;
  maxTotalDebt: number;
}

interface WealthCalculatorResult {
  years: number[];
  capital: number[];
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

export default function Home() {
  const [formData, setFormData] = useState({
    income: 30000,
    downPayment: 50000,
    monthlyDebt: 100,
    interestRate: 3,
    loanTerm: 20,
    insuranceRate: 0.2,
    hoaFees: 0,
  });

  const [wealthData, setWealthData] = useState({
    currentCapital: 10000,
    monthlyIncome: 2000,
    investmentPercentage: 20,
    returnRate: 10,
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [wealthResult, setWealthResult] = useState<WealthCalculatorResult | null>(null);
  const [paymentAdjustment, setPaymentAdjustment] = useState(0); // -50 to +50 percent

  const formatNumber = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseFormattedNumber = (value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    return Number(cleanValue);
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFormattedNumber(value);
    
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
  };

  const handleWealthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFormattedNumber(value);
    setWealthData(prev => ({ ...prev, [name]: numericValue }));
  };

  const calculateAffordability = (e: React.FormEvent) => {
    e.preventDefault();

    const { downPayment, monthlyDebt, interestRate, loanTerm, insuranceRate, hoaFees } = formData;

    // Convert percentages to decimals
    const r = interestRate / 100;
    const i = insuranceRate / 100;

    // Calculate monthly income and DTI limits
    const monthlyIncome = formData.income / 12;
    const maxPITI = monthlyIncome * 0.28; // 28% for housing
    const maxTotalDebt = monthlyIncome * 0.36; // 36% for total debt

    // Calculate mortgage constant (m)
    const monthlyRate = r / 12;
    const totalPayments = loanTerm * 12;
    const m = monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalPayments));

    // Calculate maximum property price
    const numerator = maxPITI + m * downPayment - hoaFees;
    const denominator = m + i / 12;
    let maxPrice = numerator / denominator;

    // Verify back-end DTI and adjust if necessary
    let loanAmount = maxPrice - downPayment;
    let mortgagePayment = m * loanAmount;
    let monthlyInsurance = (i * maxPrice) / 12;
    let totalPITI = mortgagePayment + monthlyInsurance + hoaFees;
    let totalDebt = totalPITI + monthlyDebt;

    if (totalDebt > maxTotalDebt) {
      const excessDebt = totalDebt - maxTotalDebt;
      const adjustmentFactor = (maxPITI - excessDebt) / maxPITI;
      maxPrice *= adjustmentFactor;
      loanAmount = maxPrice - downPayment;
      mortgagePayment = m * loanAmount;
      monthlyInsurance = (i * maxPrice) / 12;
      totalPITI = mortgagePayment + monthlyInsurance + hoaFees;
      totalDebt = totalPITI + monthlyDebt;
    }

    setResult({
      maxPrice,
      centralSize: maxPrice / 4687,
      centralType: maxPrice / 4687 < 40 ? "Studio" : maxPrice / 4687 < 64 ? "One Bedroom" : maxPrice / 4687 < 90 ? "Two Bedroom" : "Three Bedroom or Larger",
      suburbSize: maxPrice / 2500,
      suburbType: maxPrice / 2500 < 40 ? "Studio" : maxPrice / 2500 < 64 ? "One Bedroom" : maxPrice / 2500 < 90 ? "Two Bedroom" : "Three Bedroom or Larger",
      mortgagePayment,
      monthlyInsurance,
      hoaFees,
      totalPITI,
      maxPITI,
      totalDebt,
      maxTotalDebt: monthlyIncome * 0.36,
    });
  };

  const calculateWealth = (e: React.FormEvent) => {
    e.preventDefault();
    
    const years = Array.from({ length: 21 }, (_, i) => i); // 0 to 20 years
    const capital = years.map(year => {
      const monthlyInvestment = (wealthData.monthlyIncome * wealthData.investmentPercentage) / 100;
      const yearlyRate = wealthData.returnRate / 100;
      
      // Calculate compound interest with yearly contributions
      let totalCapital = wealthData.currentCapital;
      // Add monthly investments for the year and then apply yearly interest
      totalCapital = totalCapital * Math.pow(1 + yearlyRate, year) + 
                    monthlyInvestment * 12 * ((Math.pow(1 + yearlyRate, year) - 1) / yearlyRate);
      
      return Math.round(totalCapital);
    });

    setWealthResult({ years, capital });
  };

  const calculateAdjustedPrice = (price: number) => {
    return price * (1 + paymentAdjustment / 100);
  };

  const calculateAdjustedPayment = (payment: number) => {
    return payment * (1 + paymentAdjustment / 100);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Kakšno stanovanje si lahko privoščim?</h1>
      
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
                    <label htmlFor="income" className="block text-sm font-medium">Letni prihodek (neto)</label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        id="income" 
                        name="income" 
                        value={formatNumber(formData.income)} 
                        onChange={handleChange} 
                        required 
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        €
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="downPayment" className="block text-sm font-medium">Prihranki (vključen polog)</label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        id="downPayment" 
                        name="downPayment" 
                        value={formatNumber(formData.downPayment)} 
                        onChange={handleChange} 
                        required 
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        €
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="monthlyDebt" className="block text-sm font-medium">Trenutne mesečne obveznosti</label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        id="monthlyDebt" 
                        name="monthlyDebt" 
                        value={formatNumber(formData.monthlyDebt)} 
                        onChange={handleChange} 
                        required 
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        €
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="interestRate" className="block text-sm font-medium">Obrestna mera (%)</label>
                    <Input type="number" id="interestRate" name="interestRate" value={formData.interestRate} onChange={handleChange} step="0.1" min="0" max="20" required />
                  </div>
                  <div>
                    <label htmlFor="loanTerm" className="block text-sm font-medium">Trajanje kredita (let)</label>
                    <Input type="number" id="loanTerm" name="loanTerm" value={formData.loanTerm} onChange={handleChange} step="1" min="1" max="50" required />
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
                              onChange={handleChange}
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
                          <div className="relative">
                            <Input
                              type="text"
                              id="hoaFees"
                              name="hoaFees"
                              value={formatNumber(formData.hoaFees)}
                              onChange={handleChange}
                              required
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                              €
                            </div>
                          </div>
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
                      <div className="text-3xl font-bold text-blue-600">{formatNumber(Math.round(calculateAdjustedPrice(result.maxPrice)))}€</div>
                      {Number(((calculateAdjustedPayment(result.totalPITI) / (formData.income / 12)) * 100).toFixed(1)) < 30 ? (
                        <p className="text-sm text-gray-500 mt-2">
                          Glede na prihodek je izračunana vrednost smotrna.
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">
                          Glede na prihodek je izračunana vrednost rizična.
                        </p>
                      )}
                    </div>

                    <div className="relative py-8">
                      {/* Slider Bar */}
                      <div className="h-2 bg-blue-100 rounded-full">
                        <div 
                          className={`h-full rounded-full ${getPaymentColor(
                            calculateAdjustedPayment(result.totalPITI),
                            formData.income / 12
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
                          {formatNumber(Math.round(calculateAdjustedPayment(result.totalPITI)))}€ /mesec
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
                              <span>{formatNumber(Math.round(calculateAdjustedPayment(result.mortgagePayment)))}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Zavarovanje:</span>
                              <span>{formatNumber(Math.round(calculateAdjustedPayment(result.monthlyInsurance)))}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Stanovanjski sklad:</span>
                              <span>{formatNumber(calculateAdjustedPayment(result.hoaFees))}</span>
                            </li>
                            <li className="flex justify-between font-semibold">
                              <span>Skupaj:</span>
                              <span>{formatNumber(Math.round(calculateAdjustedPayment(result.totalPITI)))}</span>
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

                      <div className="space-y-2 border-t pt-4 mt-4">
                        <p className="font-semibold">Mesečne obveznosti:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p>Kredit:</p>
                          <p className="text-right">{formatNumber(Math.round(calculateAdjustedPayment(result.mortgagePayment)))}</p>
                          <p>Zavarovanje:</p>
                          <p className="text-right">{formatNumber(Math.round(calculateAdjustedPayment(result.monthlyInsurance)))}</p>
                          <p>Stroški sklada:</p>
                          <p className="text-right">{formatNumber(calculateAdjustedPayment(result.hoaFees))}</p>
                          <p className="font-semibold">Skupno mesečno obveznosti:</p>
                          <p className="text-right font-semibold">{formatNumber(Math.round(calculateAdjustedPayment(result.totalPITI)))}</p>
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
                    <div className="relative">
                      <Input
                        type="text"
                        id="currentCapital"
                        name="currentCapital"
                        value={formatNumber(wealthData.currentCapital)}
                        onChange={handleWealthChange}
                        required
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        €
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="monthlyIncome" className="block text-sm font-medium">Mesečni prihodek</label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="monthlyIncome"
                        name="monthlyIncome"
                        value={formatNumber(wealthData.monthlyIncome)}
                        onChange={handleWealthChange}
                        required
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        €
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="investmentPercentage" className="block text-sm font-medium">Procent vlaganja</label>
                    <div className="relative">
                      <Input
                        type="number"
                        id="investmentPercentage"
                        name="investmentPercentage"
                        value={wealthData.investmentPercentage}
                        onChange={handleWealthChange}
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
                    <label htmlFor="returnRate" className="block text-sm font-medium">Procent donosnosti</label>
                    <div className="relative">
                      <Input
                        type="number"
                        id="returnRate"
                        name="returnRate"
                        value={wealthData.returnRate}
                        onChange={handleWealthChange}
                        min="0"
                        max="100"
                        step="0.1"
                        required
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        %
                      </div>
                    </div>
                  </div>

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
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={wealthResult.years.map(year => ({
                          year,
                          capital: wealthResult.capital[year]
                        }))}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 20,
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
                          tickFormatter={(value) => `${formatNumber(value)}€`}
                          label={{ 
                            value: 'Kapital', 
                            angle: -90, 
                            position: 'left',
                            offset: 0
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${formatNumber(value)}€`, 'Kapital']}
                          labelFormatter={(label: number) => `Leto ${label}`}
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
                      <span className="text-sm">{formatNumber(wealthResult.capital[0])}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Končni kapital:</span>
                      <span className="text-sm font-semibold text-blue-600">{formatNumber(wealthResult.capital[20])}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mesečno vlaganje:</span>
                      <span className="text-sm">{formatNumber((wealthData.monthlyIncome * wealthData.investmentPercentage) / 100)}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Skupni donos:</span>
                      <span className="text-sm">{formatNumber(wealthResult.capital[20] - wealthResult.capital[0] - ((wealthData.monthlyIncome * wealthData.investmentPercentage) / 100) * 12 * 20)}€</span>
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