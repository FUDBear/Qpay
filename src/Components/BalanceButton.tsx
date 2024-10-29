import React, { useState, useEffect } from 'react';
import { SendProcessMessage, FormatBalance, SendProcessDryrun } from '../MiscTools';
import { useGlobalContext } from '../GlobalProvider';

const BalanceButton = () => {
  const { ADDRESS } = useGlobalContext();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (ADDRESS && ADDRESS !== 'disconnected') {
        const result = await SendProcessMessage("Balance", JSON.stringify( {"Recipient":"" +ADDRESS} ));
        const numericResult = parseInt(result, 10); 
        setBalance( FormatBalance(numericResult) );
      }
    };
    fetchBalance(); 
  }, [ADDRESS]);

  return (
    // <div className="bg-[#4318FF] text-white font-semibold py-2 px-4 rounded shadow-lg hover:bg-[#503BC4] transition duration-300 ease-in-out">
    //   {balance ? `${balance} qAR` : 'Loading...'}
    // </div>
    <div className="flex flex-col">

        <div className="flex flex-row items-center">
            <span className="text-sm text-[#A3AED0]">{balance ? `${balance} qAR` : 'Loading...'}</span>
            <img src={"https://arweave.net/26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0"} alt="Q-AR Logo" className="w-4 h-4 ml-2" />
        </div>

    </div>
  );
};

export default BalanceButton;
