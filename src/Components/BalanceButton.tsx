import React, { useState, useEffect } from 'react';
import { SendProcessMessage, FormatBalance, GetQARBalance,
    FormatBalanceDecimal
 } from '../MiscTools';
import { useGlobalContext } from '../GlobalProvider';

const BalanceButton = () => {
  const { ADDRESS } = useGlobalContext();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (ADDRESS && ADDRESS !== 'disconnected') {
        const result = await GetQARBalance(ADDRESS);
        setBalance( FormatBalance(result) );
      }
      if( ADDRESS === 'disconnected' || ADDRESS === '' )  {
        setBalance( null );
      }
    };
    fetchBalance(); 
  }, [ADDRESS]);

  return (
    <>
        {balance !== null && FormatBalanceDecimal(balance) !== "0" && (
        <div className="flex flex-row items-center">
            <span className="text-sm text-[#A3AED0]">{`${balance} qAR`}</span>
            <img src={"https://arweave.net/26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0"} alt="Q-AR Logo" className="w-4 h-4 ml-2" />
        </div>
        )}

    </>
  );
};

export default BalanceButton;
