"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
  income: number;
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

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [paymentAdjustment, setPaymentAdjustment] = useState(0); // -50 to +50 percent

  const formatNumber = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseFormattedNumber = (value: string) => {
    return parseFloat(value.replace(/\./g, "")) || 0;
  };

  const getPaymentColor = (monthlyPayment: number, monthlyIncome: number) => {
    const percentage = (monthlyPayment / monthlyIncome) * 100;
    if (percentage <= 28) return "bg-green-500";
    if (percentage <= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handlePaymentSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAdjustment(parseFloat(e.target.value));
  };

  const calculateAdjustedPayment = (basePayment: number) => {
    return basePayment * (1 + paymentAdjustment / 100);
  };

  const calculateAdjustedPrice = (basePrice: number) => {
    const adjustmentFactor = (1 + paymentAdjustment / 100);
    return basePrice * adjustmentFactor;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = name === "income" || name === "downPayment" || name === "monthlyDebt" || name === "hoaFees"
      ? parseFormattedNumber(value)
      : parseFloat(value) || 0;
    
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
  };

  const calculateAffordability = (e: React.FormEvent) => {
    e.preventDefault();

    const { income, downPayment, monthlyDebt, interestRate, loanTerm, insuranceRate, hoaFees } = formData;

    // Convert percentages to decimals
    const r = interestRate / 100;
    const i = insuranceRate / 100;

    // Calculate monthly income and DTI limits
    const monthlyIncome = income / 12;
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

    // Ljubljana price per square meter
    const centralPricePerM2 = 4687; // Central Ljubljana
    const suburbPricePerM2 = 2500; // Suburbs

    // Calculate sizes
    const centralSize = maxPrice / centralPricePerM2;
    const suburbSize = maxPrice / suburbPricePerM2;

    // Determine apartment types
    const centralType = centralSize < 40 ? "Studio" : centralSize < 64 ? "One Bedroom" : centralSize < 90 ? "Two Bedroom" : "Three Bedroom or Larger";
    const suburbType = suburbSize < 40 ? "Studio" : suburbSize < 64 ? "One Bedroom" : suburbSize < 90 ? "Two Bedroom" : "Three Bedroom or Larger";

    setResult({
      maxPrice,
      centralSize,
      centralType,
      suburbSize,
      suburbType,
      mortgagePayment,
      monthlyInsurance,
      hoaFees,
      totalPITI,
      maxPITI,
      totalDebt,
      maxTotalDebt,
      income,
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Kakšno stanovanje si lahko privoščim?</h1>
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
                <label htmlFor="income" className="block text-sm font-medium">Letni prihodek</label>
                <div className="relative">
                  <Input 
                    type="text" 
                    id="income" 
                    name="income" 
                    value={formatNumber(formData.income)} 
                    onChange={handleChange} 
                    required 
                    className="pr-8"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                    €
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="downPayment" className="block text-sm font-medium">Prihranki (Polog)</label>
                <div className="relative">
                  <Input 
                    type="text" 
                    id="downPayment" 
                    name="downPayment" 
                    value={formatNumber(formData.downPayment)} 
                    onChange={handleChange} 
                    required 
                    className="pr-8"
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
                    className="pr-8"
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
              <div>
                <label htmlFor="insuranceRate" className="block text-sm font-medium">Precent na za plačilo zavarovanja (%)</label>
                <Input type="number" id="insuranceRate" name="insuranceRate" value={formData.insuranceRate} onChange={handleChange} step="0.1" min="0" max="5" required />
              </div>
              <div>
                <label htmlFor="hoaFees" className="block text-sm font-medium">Stanovanjski sklad</label>
                <div className="relative">
                  <Input 
                    type="text" 
                    id="hoaFees" 
                    name="hoaFees" 
                    value={formatNumber(formData.hoaFees)} 
                    onChange={handleChange} 
                    required 
                    className="pr-8"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                    €
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">Izračunaj</Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Results */}
        <Card>
          <CardHeader>
            <CardTitle>Rezulat</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Privoščiš si lahko nepremičnino do:</h3>
                  <div className="text-3xl font-bold text-blue-600">€{formatNumber(Math.round(calculateAdjustedPrice(result.maxPrice)))}</div>
                  {Number(((calculateAdjustedPayment(result.totalPITI) / (result.income / 12)) * 100).toFixed(1)) < 30 ? (
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
                        result.income / 12
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
                      €{formatNumber(Math.round(calculateAdjustedPayment(result.totalPITI)))}/meses
                    </p>
                  </div>

                  {/* Payment Adjustment Slider */}
                  <div className="mt-12 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prilagodi mesečno plačilo
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={paymentAdjustment}
                      onChange={handlePaymentSliderChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>-50%</span>
                      <span className={`font-medium ${getPaymentColor(
                        calculateAdjustedPayment(result.totalPITI),
                        result.income / 12
                      ).replace('bg-', 'text-')}`}>
                        {`${
                          ((calculateAdjustedPayment(result.totalPITI) / (result.income / 12)) * 100).toFixed(1)
                        }% of Income`}
                      </span>
                      <span>+50%</span>
                    </div>
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
                    <p className="text-right">€{formatNumber(Math.round(result.mortgagePayment))}</p>
                    <p>Zavarovanje:</p>
                    <p className="text-right">€{formatNumber(Math.round(result.monthlyInsurance))}</p>
                    <p>Stroški sklada:</p>
                    <p className="text-right">€{formatNumber(Math.round(result.hoaFees))}</p>
                    <p className="font-semibold">Skupno mesečno obveznosti:</p>
                    <p className="text-right font-semibold">€{formatNumber(Math.round(result.totalPITI))}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">Vnesi svoje prihodke in stisni &quot;Izračunaj&quot; za izracun.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}