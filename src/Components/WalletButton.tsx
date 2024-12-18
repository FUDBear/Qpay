import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from 'react';
import { dryrun, message, createDataItemSigner, result  } from "@permaweb/aoconnect";
import { PermissionType } from 'arconnect';
import { useGlobalContext } from '../GlobalProvider';
import { TruncateAddress } from "../MiscTools";
import { motion } from 'framer-motion';

function WalletButton() {

    const { setADDRESS, ADDRESS } = useGlobalContext();

    const connectWallet = async () => {
      try {
        if (window.arweaveWallet) {
          await window.arweaveWallet.connect([
            'ACCESS_ADDRESS',
            'SIGN_TRANSACTION',
          ]);

          const walletAddress = await window.arweaveWallet.getActiveAddress();
          setADDRESS(walletAddress); // Global
          console.log("Connected wallet address: ", walletAddress);
        } else {
          console.log("ArConnect is not installed.");
        }
      } catch (error) {
        console.error("Failed to connect wallet: ", error);
      }
    };
  
    const disconnectWallet = async () => {
      try {
        if (window.arweaveWallet) {
          await window.arweaveWallet.disconnect();
          setADDRESS("disconnected");
          console.log("Wallet disconnected.");
        } else {
          console.log("ArConnect is not installed.");
        }
      } catch (error) {
        console.error("Failed to disconnect wallet: ", error);
      }
    };

    return (
        <div>
    
          {
            ADDRESS !== "disconnected" ? (
              <div className="flex flex-col items-center">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.6 }}
                onClick={disconnectWallet}
                className="px-5 py-2 bg-[#4318FF] rounded-xl min-w-[100px] transition-colors bg-astro-primary text-white hover:bg-[#4936B2]"
              >
                Disconnect
              </motion.button>
              <span className="text-xs text-[#A3AED0]">{TruncateAddress(ADDRESS)}</span>
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.6 }}
                onClick={connectWallet}
                className="px-5 py-2 bg-[#4318FF] rounded-xl min-w-[100px] transition-colors bg-astro-primary text-white hover:bg-[#4936B2]"
              >
                Connect
              </motion.button>
            )
          }
        </div>
      );
}

export default WalletButton;
