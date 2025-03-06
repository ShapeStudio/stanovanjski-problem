import React from "react";
import { Input, InputProps } from "./Input";
import { format, useNumberFormat } from "@react-input/number-format";
import { currencyOptions, parseCurrency } from "../utils/formatCurrency";

type Props = Omit<InputProps, "onChange"> & {
  onChange?: (value: number) => void;
  value: number;
};

export default function CurrencyInput({ onChange, value, ...props }: Props) {
  const ref = useNumberFormat(currencyOptions);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseCurrency(e.target.value);
    onChange?.(newVal);
  };
  return (
    <Input
      ref={ref}
      onChange={handleChange}
      value={value ? format(value, currencyOptions) : ""}
      {...props}
    />
  );
}
