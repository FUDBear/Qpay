import React, { useState, useEffect } from 'react';
import { FormatBalance, GetQARBalance, FormatBalanceDecimal } from '../MiscTools';
import { useGlobalContext } from '../GlobalProvider';

const BalanceButton = () => {
  const { ADDRESS, QARBALANCE, setQARBALANCE } = useGlobalContext();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchBalance = async () => {
      if (ADDRESS && ADDRESS !== 'disconnected') {
        const result = await GetQARBalance(ADDRESS);
        setQARBALANCE(FormatBalance(result));
      }
      if (ADDRESS === 'disconnected' || ADDRESS === '') {
        setQARBALANCE(null);
      }
    };

    fetchBalance();

    interval = setInterval(() => {
      fetchBalance();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [ADDRESS, setQARBALANCE]);

  return (
    <>
      {QARBALANCE !== null && FormatBalanceDecimal(QARBALANCE) !== '0' && (
        <div className="flex flex-row items-center">
          <span className="text-sm text-[#A3AED0]">{`${QARBALANCE} qAR`}</span>
          <img
            src="https://arweave.net/26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0"
            alt="Q-AR Logo"
            className="w-4 h-4 ml-2"
          />
        </div>
      )}
    </>
  );
};

export default BalanceButton;
