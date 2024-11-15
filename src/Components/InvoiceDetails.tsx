import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendInvoicePayment, SendPayMessage, ConvertTimestampToDateTime, 
  FormatBalanceDecimal, SendProcessMessage, FormatBalance, 
  GetQARBalance, TruncateAddress } from '../MiscTools';
import ClipLoader from 'react-spinners/ClipLoader';
import { Invoice, Sender } from "../Types";
import Breadcrumbs from './Breadcrumbs';
import CopyButton from './CopyButton';
import QRCode from "react-qr-code";
import Swal from 'sweetalert2';
import { AnimatePresence, motion } from 'framer-motion';

function InvoiceDetails() {

  const { ADDRESS, QARBALANCE, setQARBALANCE } = useGlobalContext();
  const navigate = useNavigate();

  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [parsedRequestees, setParsedRequestees] = useState<Sender[]>([]);
  const [requestee, setRequestee] = useState<Sender | null>(null);
  const [loading, setLoading] = useState(true);

  const [isOwner, setIsOwner] = useState(false);

  const showDeleteConfirm = () => {
      Swal.fire({
        title: 'Delete Invoice?',
        text: 'Are you sure you want to delete this invoice?',
        color: "black",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: '#4318FF',
      }).then((result) => {
        if (result.isConfirmed) {

          handleDeleteInvoice();

          Swal.fire({ title:"Invoice Deleted!", text:"", icon:"success", confirmButtonColor: '#4318FF'}).then((result) => {
            navigate("/");
          });
        } 
      });
  };

  const showSuccess = () => {
    Swal.fire({
      title: 'Success!',
      text: 'Your invoice has been successfully paid',
      color: "black",
      icon: 'success',
      confirmButtonText: 'Done',
      confirmButtonColor: '#4318FF',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/");
      }
    });
  };

  const showFail = () => {
    Swal.fire({
      title: 'Invoice Error',
      text: 'Payment failed',
      color: "black",
      icon: 'error',
      confirmButtonText: 'Done',
    });
  };

  useEffect(() => {
    const fetchOwnership = async () => {
      const result = await checkOwner();
      setIsOwner(result);
    };
    fetchOwnership();
  }, [invoice, ADDRESS]);

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
    if (typeof invoice?.Senders === "string") {
      try {
        const requesteesArray: Sender[] = JSON.parse(invoice.Senders);
        setParsedRequestees(requesteesArray);
      } catch (error) {
        console.error("Failed to parse Requestees JSON:", error);
        setParsedRequestees([]);
      }
    } else if (Array.isArray(invoice?.Senders)) {
      setParsedRequestees([]);
    }
  }, [invoice?.Senders]);

  useEffect(() => {
    const foundRequestee = parsedRequestees.find((requestee) => requestee.Address === ADDRESS);

    if (foundRequestee) {
      setRequestee(foundRequestee);
    } else {
      setRequestee(null);
    }
  }, [parsedRequestees]);

  useEffect(() => {
    console.log("Requestee:", requestee);
  }, [requestee]);

  const getBalance = async () => {
    const fetchBalance = async () => {
      try {
        const result = await GetQARBalance(ADDRESS);
        setQARBALANCE( FormatBalance(result) );

      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
  };

  const handlePayInvoice = async () => {

    if (requestee?.Status === 'Pending' && invoice) {
      try {
        const paymentResult = await SendInvoicePayment(ADDRESS, invoice.InvoiceID, requestee.Amount.toString());
        console.log("Payment result:", paymentResult);
        setInvoice((prev) => prev ? { ...prev, Status: 'Paid', PaidTimestamp: Math.floor(Date.now() / 1000).toString()  } : null);
        getBalance();

        if(paymentResult === "Success") {
          showSuccess(); // Should be confirm, not success
        } else {
          showFail();
        }

      } catch (error) {
        console.error("Failed to pay invoice:", error);
      }
    }
  };

  const checkOwner = async () => {
    return invoice?.ReceiverWallet === ADDRESS && invoice?.Status === 'Pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <ClipLoader color="#4318FF" loading={loading} size={50} />
      </div>
    );
  }

  const handleDeleteInvoice = async () => {
    try {
      if (ADDRESS !== 'disconnected' && window.arweaveWallet) {

        if( invoice ) {
          const data = {  InvoiceID: invoice.InvoiceID };
          console.log( data );

          const result = await SendPayMessage("Delete-Invoice", JSON.stringify(data));
          console.log("Result: ", result);

          if(result)
          {

          }

        } else {
          console.log("ArConnect is not installed.");
        }
      } else {
        console.log("No Invoice to delete.");
      }
    } catch (error) {
      console.error("Failed to create invoice: ", error);
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">

      <Breadcrumbs />

      <div className="p-8 bg-[#ffffff] rounded-lg min-w-[400px] max-w-md mx-auto">

      <div className="flex items-center justify-between mb-4">
        
        <h2 className="text-2xl font-semibold text-[#2b3674]">Invoice</h2>
        
        {isOwner && (
        <div className="relative flex items-center group">
          <button onClick={showDeleteConfirm} className="flex items-center rounded-xl text-white font-semibold py-2 px-2 hover:bg-gray-200 transition duration-300 ease-in-out">
            <img src={'./images/purple_icons/delete.svg'} alt="Delete Invoice" className="w-6 h-6" />
          </button>
          <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg">
            Delete Invoice
          </span>
        </div>
      )}
      
      </div>

      
      {invoice ? (
        <div>

        <motion.div
          style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" , backgroundColor: "#FFFFFF" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={window.location.href}
            viewBox={`0 0 256 256`}
            fgColor="#2b3674"
            bgColor="#FFFFFF"
          />
        </motion.div>

          {/* Invoice ID */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/receipt.svg"} alt="invoice id" className="w-4 h-4" />
              <span className="font-semibold">Invoice ID:</span>
            </div>

            <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
            <span className="text-sm text-[#A3AED0]">{invoice.InvoiceID}</span>
            </motion.div>
          </div>

          {/* Time */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/schedule.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold">Date:</span>
            </div>

            <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
              <span className="text-sm text-[#A3AED0]">{ConvertTimestampToDateTime(invoice.Timestamp)}</span>
            </motion.div>
          </div>

          {/* Requester Wallet */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/wallet.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold"> Reciever ({invoice.ReceiverName})</span>
            </div>

            <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
              <span className="text-sm text-[#A3AED0]">{invoice.ReceiverWallet}</span>
              <CopyButton textToCopy={invoice.ReceiverWallet} />
            </motion.div>
          </div>

          {/* Requestees */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/payments.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold">Payers</span>
            </div>

            {parsedRequestees.length > 0 ? (
              parsedRequestees.map((requestee, index) => (
                <motion.div 
                  key={index} 
                  className={`flex flex-row justify-around mb-2 p-2 rounded-lg bg-slate-50 ${
                    requestee.Address === ADDRESS 
                      ? requestee.Status === "Paid" 
                        ? "bg-green-50" 
                        : "bg-orange-50"
                      : ""
                  }`}
                  whileHover={{ scale: 1.02 }} 
                  transition={{ type: "tween", stiffness: 100 }}
                >
                  <div className="flex flex-row items-center space-x-2">
                    <span className="text-sm text-[#A3AED0]">{ TruncateAddress(requestee.Address) }</span>
                    <CopyButton textToCopy={requestee.Address} />
                  </div>

                  <div className="flex flex-row items-center space-x-2">
                    <span className="text-sm text-[#A3AED0] font-semibold">Amount:</span>
                    <span className="text-sm text-[#2b3674]">{ FormatBalance(parseInt(requestee.Amount)) }</span>
                  </div>

                  <div className="flex flex-row items-center space-x-2">
                  {requestee.Status === "Paid" ? (
                    <div className="relative flex items-center group">
                      <div className="items-center">
                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Paid</span>
                      </div>
                      {/* <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg z-50">
                        {ConvertTimestampToDateTime(invoice.PaidTimestamp)}
                      </span> */}
                    </div>
                  ) : (
                    <div className="items-start">
                      <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
                      <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                      </motion.div>
                    </div>

                  )}
                  </div>
                </motion.div>
              ))
            ) : (
              <span className="text-sm text-[#A3AED0]">No requestees available</span>
            )}

            {/* <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
              <span className="text-sm text-[#A3AED0]">{invoice.Requestees[0].Address}</span>
              <CopyButton textToCopy={invoice.Requestees[0].Address} />
            </motion.div> */}
            
          </div>
          

          {/* Amount */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"https://arweave.net/26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0"} alt="Q-AR Logo" className="w-4 h-4t" />
              <span className="font-semibold">Total Amount</span>
            </div>

            <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
              <span className="text-sm text-[#A3AED0]">{FormatBalanceDecimal(invoice.Amount)}</span>
            </motion.div>
            
          </div>

          {/* Note */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/note.svg"} alt="Note Logo" className="w-4 h-4" />
              <span className="font-semibold">Note</span>
            </div>

            <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
              <span className="text-sm text-[#A3AED0]">{invoice.InvoiceNote}</span>
            </motion.div>
          </div>

          {/* Status */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/note.svg"} alt="Note Logo" className="w-4 h-4" />
              <span className="font-semibold">Status</span>
            </div>

            {invoice.Status === "Paid" ? (
              <div className="relative flex items-center group">
                <div className="items-center">
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Paid</span>
                </div>
                <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg z-50">
                  {ConvertTimestampToDateTime(invoice.PaidTimestamp)}
                </span>
              </div>
            ) : (
              <div className="items-start">
                <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
                <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                </motion.div>
              </div>

            )}
          </div>

          {requestee?.Status === 'Pending' && requestee?.Address === ADDRESS  &&(
            
            <div className="flex flex-col items-center mb-2">
              <button
                onClick={handlePayInvoice}
                className="bg-[#4318FF] text-white font-semibold py-2 px-4 rounded hover:bg-[#503BC4] transition duration-300 ease-in-out"
              >
                Pay Invoice { FormatBalance( parseInt(requestee.Amount) ) }
              </button>
              
              <span className="text-sm text-[#A3AED0]">Balance: {QARBALANCE} qAR</span>
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
