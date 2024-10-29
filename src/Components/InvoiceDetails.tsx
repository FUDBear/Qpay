import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendInvoicePayment, SendPayMessage, ConvertTimestampToDateTime, 
  FormatBalanceDecimal, SendProcessMessage, FormatBalance } from '../MiscTools';
import ClipLoader from 'react-spinners/ClipLoader';
import { Invoice, Balance } from "../Types";
import Breadcrumbs from './Breadcrumbs';
import CopyButton from './CopyButton';
import QRCode from "react-qr-code";

function InvoiceDetails() {

  const { ADDRESS } = useGlobalContext();

  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        const result = await SendPayMessage("Get-Invoice-By-Id", JSON.stringify({ InvoiceID: id }));
        setInvoice(JSON.parse(result));
      } catch (error) {
        console.error("Failed to fetch invoice details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id]);


  useEffect(() => {
    const fetchBalance = async () => {
      try {

        const result = await SendProcessMessage("Balance", JSON.stringify( {"Recipient":"" +ADDRESS} ));
        const numericResult = parseInt(result, 10); 
        // console.log( numericResult );
        // console.log( FormatBalance(numericResult) );
        setBalance( FormatBalance(numericResult) );


      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
  }, [id]);

  const handlePayInvoice = async () => {
    if (invoice?.Status === 'Pending') {
      try {
        const paymentResult = await SendInvoicePayment(invoice.RequesteeWallet, invoice.InvoiceID, invoice.Amount.toString());
        console.log("Payment result:", paymentResult);
        setInvoice((prev) => prev ? { ...prev, Status: 'Paid' } : null);
      } catch (error) {
        console.error("Failed to pay invoice:", error);
      }
    }
  };

  if (loading) {
    return <ClipLoader color="#4318FF" loading={loading} size={50} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">

      <Breadcrumbs />

      <div className="p-8 bg-[#ffffff] rounded-lg min-w-[400px] max-w-md mx-auto">

      <h2 className="text-2xl font-semibold mb-4 text-[#2b3674]">Invoice Details</h2>
      
      {invoice ? (
        <div>

          <div style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" }}>
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={window.location.href}
              viewBox={`0 0 256 256`}
              fgColor="#2b3674"
              bgColor="#FFFFFF"
            />
          </div>

          {/* Invoice ID */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/receipt.svg"} alt="invoice id" className="w-4 h-4" />
              <span className="font-semibold">Invoice ID:</span>
            </div>

            <span className="text-sm text-[#A3AED0]">{invoice.InvoiceID}</span>
          </div>

          {/* Time */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/schedule.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold">Date:</span>
            </div>

            <span className="text-sm text-[#A3AED0]">{ConvertTimestampToDateTime(invoice.Timestamp)}</span>
          </div>

          {/* Requester Wallet */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/wallet.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold"> Reciever ({invoice.RequestorName})</span>
            </div>

            <div className="flex flex-row items-center space-x-2">
              <span className="text-sm text-[#A3AED0]">{invoice.RequestorWallet}</span>
              <CopyButton textToCopy={invoice.RequestorWallet} />
            </div>
          </div>

          {/* Requestee Wallet */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/payments.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold">Payer</span>
            </div>

            <div className="flex flex-row items-center space-x-2">
              <span className="text-sm text-[#A3AED0]">{invoice.RequesteeWallet}</span>
              <CopyButton textToCopy={invoice.RequesteeWallet} />
            </div>
            
          </div>

          {/* Amount */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"https://arweave.net/26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0"} alt="Q-AR Logo" className="w-4 h-4t" />
              <span className="font-semibold">Amount</span>
            </div>

            <span className="text-sm text-[#A3AED0]">{FormatBalanceDecimal(invoice.Amount)}</span>
          </div>

          {/* Note */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/note.svg"} alt="Note Logo" className="w-4 h-4" />
              <span className="font-semibold">Note</span>
            </div>

            <span className="text-sm text-[#A3AED0]">{invoice.InvoiceNote}</span>
          </div>

          {/* Status */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/note.svg"} alt="Note Logo" className="w-4 h-4" />
              <span className="font-semibold">Status</span>
            </div>

            {invoice.Status === "Paid" ? (
              <div className="items-start">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Paid</span>
              </div>
            ) : (
              <div className="items-start">
                <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
              </div>

            )}
          </div>

          {invoice.Status === 'Pending' && (
            
            <div className="flex flex-col items-center mb-2">
              <button
                onClick={handlePayInvoice}
                className="bg-[#4318FF] text-white font-semibold py-2 px-4 rounded hover:bg-[#503BC4] transition duration-300 ease-in-out"
              >
                Pay Invoice
              </button>
              
              <span className="text-sm text-[#A3AED0]">Balance: {balance} qAR</span>
            </div>
            
          )}

      </div>
      ) : (
        <p className="text-gray-500">Invoice not found.</p>
      )}

      </div> 

    </div>
  );
}

export default InvoiceDetails;
