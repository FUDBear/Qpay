import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from 'react';
import { dryrun, message, createDataItemSigner, result  } from "@permaweb/aoconnect";
import { PermissionType } from 'arconnect';
import { useGlobalContext } from '../GlobalProvider';
import { SendProcessMessage, SendProcessDryrun, GetQARBalance, GetTokenInfo, SendPayMessage,
  FormatBalance, SendInvoicePayment
 } from '../MiscTools';


function TestButtons() {

    const { ADDRESS } = useGlobalContext();

    // New Invoice
    const [requestorName, setRequestorName] = useState("");
    const [requesteeAddress, setRequesteeAddress] = useState("");
    const [requestedAmount, setRequestedAmount] = useState(0);
    const [note, setNote] = useState("");

    // PayInvoice
    const[invoiceId, setInvoiceId] = useState("");
  
    const testerClick = async () => {
      try {
        if ( ADDRESS !== 'disconnected' && window.arweaveWallet) {

            // const result = await SendPayMessage("GetUsers", "");
            const newInvoice = { 
              RequestorName: "Me Again",
              RequestorAddress: ADDRESS,
              RequesteeAddress: "EQ7Tnk_FuAAeIkax8-JlBxeMtgc6mrNRqL6opiqWLos",
              Note: "This is a test invoice",
              Amount: 10,
              Currency: "qAR",
             };


            const result = await SendPayMessage("Create-New-Invoice", JSON.stringify( newInvoice ) );
            console.log("Result: ", result);

        } else {
          console.log("ArConnect is not installed.");
        }
      } catch (error) {
        console.error("Failed to disconnect wallet: ", error);
      }
    };

    const GetBalances = async () => {
        try {
          if ( ADDRESS !== 'disconnected' && window.arweaveWallet) {
  
            const result = await SendProcessDryrun("Balances", "");
            console.log( result );
  
          } else {
            console.log("ArConnect is not installed.");
          }
        } catch (error) {
          console.error("Failed to disconnect wallet: ", error);
        }
      };

      const GetBalance = async () => {
        try {
          if ( ADDRESS !== 'disconnected' && window.arweaveWallet) {
  
            // const result = await SendProcessMessage("Balance", JSON.stringify( {"Recipient":"" +ADDRESS} ));

            // const result = await SendProcessDryrun("Balance", JSON.stringify( {"Recipient":"" +ADDRESS} ));
            // console.log( "Result: " , result );

            const result = await GetQARBalance( ADDRESS );
            console.log( "Result: " , result );

            // const numericResult = parseInt(result, 10); 
            // console.log( numericResult );
            // console.log( FormatBalance(numericResult) );
            
  
          } else {
            console.log("ArConnect is not installed.");
          }
        } catch (error) {
          console.error("Failed to disconnect wallet: ", error);
        }
      };

      const GetInfo = async () => {
        try {
          if ( ADDRESS !== 'disconnected' && window.arweaveWallet) {
  
            const result = await GetTokenInfo();
            console.log(result);
  
          } else {
            console.log("ArConnect is not installed.");
          }
        } catch (error) {
          console.error("Failed to disconnect wallet: ", error);
        }
      };

      const GetInvoices = async () => {
        try {
          if ( ADDRESS !== 'disconnected' && window.arweaveWallet) {
  
              const data = {
                Address: ADDRESS,
              };
              const result = await SendPayMessage("Get-Address-Invoices", JSON.stringify( data ) );
              console.log("Result: ", result);
  
          } else {
            console.log("ArConnect is not installed.");
          }
        } catch (error) {
          console.error("Failed to disconnect wallet: ", error);
        }
      };

    const CreateInvoice = async () => {
        try {
          if (ADDRESS !== 'disconnected' && window.arweaveWallet) {
              const newInvoice = {
                  RequestorName: requestorName, // Use the state for the requestor name
                  RequestorAddress: ADDRESS,
                  RequesteeAddress: requesteeAddress, // Use the state for the requestee address
                  Note: note, // Use the state for the note
                  Amount: requestedAmount, // Use the state for the requested amount
                  Currency: "qAR",
              };

              const result = await SendPayMessage("Create-New-Invoice", JSON.stringify(newInvoice));
              console.log("Result: ", result);
          } else {
              console.log("ArConnect is not installed.");
          }
      } catch (error) {
          console.error("Failed to create invoice: ", error);
      }
    };

    const PayInvoice = async () => {
      try {
        if (ADDRESS !== 'disconnected' && window.arweaveWallet) {

            const result = await SendInvoicePayment( ADDRESS, invoiceId, "10" );
            console.log("Result: ", result);
        } else {
            console.log("ArConnect is not installed.");
        }
    } catch (error) {
        console.error("Failed to create invoice: ", error);
    }
  };

  return (
    <div className="p-8 bg-[#ffffff] rounded-lg">
      <div className="space-y-4">
        {/* Send Test Message */}
        <button
          onClick={testerClick}
          className="bg-[#4318FF] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#503BC4] transition ease-in-out duration-200 shadow-lg"
        >
          Send Test Msg
        </button>

        {/* Get All Balances */}
        <button
          onClick={GetBalances}
          className="bg-[#503BC4] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#4318FF] transition ease-in-out duration-200 shadow-lg"
        >
          Balances
        </button>

        {/* Get Balance for Wallet */}
        <button
          onClick={GetBalance}
          className="bg-[#503BC4] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#4318FF] transition ease-in-out duration-200 shadow-lg"
        >
          Balance
        </button>

        {/* Other buttons... */}

        {/* Input for Invoice ID */}
        <div className="mt-6">
          <label className="block text-gray-700 font-bold mb-2">Invoice To Pay</label>
          <input
            type="text"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
            placeholder="Enter invoice ID"
          />
        </div>

        {/* Pay Invoice */}
        <button
          onClick={PayInvoice}
          className="bg-[#4318FF] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#503BC4] transition ease-in-out duration-200 shadow-lg mt-4"
        >
          Pay Invoice
        </button>

        {/* Form Fields */}
        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Requestor Name</label>
            <input
              type="text"
              value={requestorName}
              onChange={(e) => setRequestorName(e.target.value)}
              className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
              placeholder="Enter requestor name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Requestee Address</label>
            <input
              type="text"
              value={requesteeAddress}
              onChange={(e) => setRequesteeAddress(e.target.value)}
              className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
              placeholder="Enter requestee address"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Requested Amount</label>
            <input
              type="number"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(parseFloat(e.target.value))}
              className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
              placeholder="Enter requested amount"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
              placeholder="Enter a note for the invoice"
            />
          </div>

          {/* Create Invoice Button */}
          <button
            onClick={CreateInvoice}
            className="bg-[#4318FF] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#503BC4] transition ease-in-out duration-200 shadow-lg mt-4"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestButtons;
