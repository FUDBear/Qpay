import React from 'react';
import { FormatBalance, FormatBalanceDecimal } from '../MiscTools';

type BalanceTooltipProps = {
  amount: number;
  currency: string;
};

function BalanceTooltip({ amount, currency }: BalanceTooltipProps) {
  return (
    <div className="relative group">
      <span>{FormatBalance(amount)} {currency}</span>
      
      <div className="z-50 absolute right-0 bottom-full mb-1 w-max bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {FormatBalanceDecimal(amount)}
      </div>
    </div>
  );
}

export default BalanceTooltip;
