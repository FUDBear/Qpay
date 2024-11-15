import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { TruncateAddress, GetTokenInfo, FormatBalanceUSD, FormatBalanceDecimal,
  GetTableImgSource
 } from "../MiscTools";
import { Invoice, TokenInfo } from "../Types";
import BalanceTooltip from './BalanceTooltip';
import { AnimatePresence, motion } from 'framer-motion';

type InvoiceCellProps = {
  invoice: Invoice;
};

function InvoiceCell({ invoice }: InvoiceCellProps) {

  const { ADDRESS } = useGlobalContext();
  const navigate = useNavigate();

  // const [tokenInfo , setTokenInfo] = useState<TokenInfo>({} as TokenInfo);

  const handleClick = () => {
    navigate(`/${invoice.InvoiceID}`);
  };

  const [isHighlighted, setIsHighlighted ] = useState(false);
  
  

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer p-4 border-b hover:bg-gray-100 transition duration-200 ease-in-out flex items-center justify-between rounded-lg bg-white`}
    >

    {/* ${ isHighlighted ? 'bg-[#F0EDFF]' : 'bg-white'  } */}

      <div className="flex items-center space-x-4">

      <div className="flex-shrink-0">
        <motion.img
          src={GetTableImgSource(invoice, ADDRESS)}
          alt="Invoice"
          className="w-12 h-12 rounded-full border-2 border-[#4318FF]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      </div>

        
        <div className="flex flex-col">
          <span className="font-semibold">{invoice.ReceiverName}</span>
          <span className="text-sm text-[#A3AED0]">{TruncateAddress(invoice.ReceiverWallet)}</span>
          <span className="text-sm text-[#A3AED0]">{isHighlighted}</span>

        </div>

      </div>
      
      <div className="flex flex-col min-w-[100px] h-0 items-center justify-end"></div>

      {invoice.Status === "Paid" ? (  
          <div className="items-center">
            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Paid</span>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            <img
              src={"https://arweave.net/26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0"}
              alt="qAR Logo"
              className="w-4 h-4 mt-6 rounded-full"
            />
            
            <div>
              <BalanceTooltip amount={invoice.Amount} currency={invoice.Currency} />
            </div>
          </div>

        )}

    </div>
  );
}

export default InvoiceCell;
