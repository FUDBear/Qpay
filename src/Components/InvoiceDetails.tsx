import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendInvoicePayment, SendPayMessage, ConvertTimestampToDateTime, 
  FormatBalanceDecimal, SendProcessMessage, FormatBalance, 
  GetQARBalance, TruncateAddress } from '../MiscTools';
import ClipLoader from 'react-spinners/ClipLoader';
import { Invoice, Sender, Receiver, Signer } from "../Types";
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
  const [parsedSenders, setParsedSenders] = useState<Sender[]>([]);
  const [parsedReceivers, setParsedReceivers] = useState<Receiver[]>([]);
  const [parsedSigners, setParsedSigners] = useState<Signer[]>([]);
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
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/");
      }
    });
  };

  const showSignSuccess = () => {
    Swal.fire({
      title: 'Success!',
      text: 'Your invoice has been successfully signed',
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

  const showSignFail = () => {
    Swal.fire({
      title: 'Invoice Error',
      text: 'Signature failed',
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
        setParsedSenders(requesteesArray);
      } catch (error) {
        console.error("Failed to parse Requestees JSON:", error);
        setParsedSenders([]);
      }
    } else if (Array.isArray(invoice?.Senders)) {
      setParsedSenders([]);
    }
  }, [invoice?.Senders]);

  useEffect(() => {
    if (typeof invoice?.Receivers === "string") {
      try {
        const receiversArray: Receiver[] = JSON.parse(invoice.Receivers);
        setParsedReceivers(receiversArray);
      } catch (error) {
        console.error("Failed to parse Receivers JSON:", error);
        setParsedReceivers([]);
      }
    } else if (Array.isArray(invoice?.Receivers)) {
      setParsedReceivers([]);
    }
  }, [invoice?.Receivers]);


  useEffect(() => {
    if (typeof invoice?.Signers === "string") {
      try {
        const signersArray: Signer[] = JSON.parse(invoice.Signers);
        setParsedSigners(signersArray);
      } catch (error) {
        console.error("Failed to parse signers JSON:", error);
        setParsedSigners([]);
      }
    } else if (Array.isArray(invoice?.Receivers)) {
      setParsedReceivers([]);
    }
  }, [invoice?.Signers]);

  useEffect(() => {
    const foundRequestee = parsedSenders.find((requestee) => requestee.Address === ADDRESS);

    if (foundRequestee) {
      setRequestee(foundRequestee);
    } else {
      setRequestee(null);
    }
  }, [parsedSenders]);

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

    setLoading(true);

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

  const handleSignInvoice = async () => {

    setLoading(true);

    if (invoice) {
      // console.log("Signing invoice:", invoice);
      try {
        const signResult = await SendPayMessage("Sign-Invoice-By-Id", JSON.stringify({ InvoiceID: id }));
        console.log("Signature result:", signResult);
        // setInvoice((prev) => prev ? { ...prev, Status: 'Paid', PaidTimestamp: Math.floor(Date.now() / 1000).toString()  } : null);
        // getBalance();

        if(signResult !== "") {
          showSignSuccess();
        } else {
          showSignFail();
        }

      } catch (error) {
        console.error("Failed to sign invoice:", error);
      }
    }
  };

  const checkOwner = async () => {
    return invoice?.Owner === ADDRESS && invoice?.Status === 'Pending';
  };

  // This is gross and needs to be refactored
  const getScheduledPaymentTime = () => {
    if( parsedReceivers && parsedReceivers.length > 0 ) {
      return  "" + ConvertTimestampToDateTime(parsedReceivers[0].ScheduledTimestamp);
    } 
    return "";
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

      {/* Spacer */}
      <div className="h-16"></div>

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

          {/* Receiver */}
          <div className="flex flex-col mb-2">
          
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/wallet.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold">
                Receiver 
                {parsedReceivers[0]?.Name ? ` (${parsedReceivers[0].Name})` : ""}
              </span>
            </div>


            <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
              <span className="text-sm text-[#A3AED0]">{parsedReceivers[0]?.Address}</span>
              <CopyButton textToCopy={parsedReceivers[0]?.Address} />
            </motion.div>

          </div>

          {/* Requestees */}
          <div className="flex flex-col mb-2">
            <div className="flex flex-row items-center space-x-2">
              <img src={"./images/purple_icons/payments.svg"} alt="date" className="w-4 h-4" />
              <span className="font-semibold">Payers</span>
            </div>

            {parsedSenders.length > 0 ? (
              parsedSenders.map((requestee, index) => (
                <motion.div 
                  key={index} 
                  className={`flex flex-row justify-around mb-2 p-2 rounded-lg ${
                    requestee.Address === ADDRESS 
                      ? requestee.Status === "Paid" 
                        ? "bg-green-50" 
                        : "bg-orange-50"
                      : "bg-slate-50"
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
                      <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg z-50 whitespace-nowrap">
                        Paid - {ConvertTimestampToDateTime(requestee.PaidTimestamp)}
                      </span>

                    </div>
                  ) : (
                   
                  <>
                    {invoice?.InvoiceType !== "PrePaidScheduled" && (
                      <div className="relative flex items-center group">
                        <div className="items-center">
                          <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                        </div>
                      </div>
                    )}

                    {invoice?.InvoiceType === "PrePaidScheduled" && (
                      <div className="relative flex items-center group">
                         <div className="items-center">
                           <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Scheduled</span>
                         </div>
                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg z-50 whitespace-nowrap">
                          {getScheduledPaymentTime()}
                         </span>
                      </div>
                    )}

                  </>

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

          {/* Signers */}
          {parsedSigners.length > 0 && (
            <div className="flex flex-col mb-2">
              <div className="flex flex-row items-center space-x-2">
                <img src={"./images/purple_icons/signature.svg"} alt="date" className="w-4 h-4" />
                <span className="font-semibold">Signers</span>
              </div>

              {parsedSigners.map((signer, index) => (
                <motion.div 
                  key={index} 
                  className={`flex flex-row justify-around mb-2 p-2 rounded-lg ${
                    signer.Address === ADDRESS 
                      ? signer.Status === "Signed" 
                        ? "bg-green-50" 
                        : "bg-orange-50"
                      : "bg-slate-50"
                  }`}
                  whileHover={{ scale: 1.02 }} 
                  transition={{ type: "tween", stiffness: 100 }}
                >
                  <div className="flex flex-row items-center space-x-2">
                    <span className="text-sm text-[#A3AED0]">{TruncateAddress(signer.Address)}</span>
                    <CopyButton textToCopy={signer.Address} />
                  </div>

                  <div className="flex flex-row items-center space-x-2">
                    {signer.Status === "Signed" ? (
                      <div className="relative flex items-center group">
                        <div className="items-center">
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">Signed</span>
                        </div>
                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg z-50 whitespace-nowrap">
                          Signed - {ConvertTimestampToDateTime(signer.Timestamp)}
                        </span>
                      </div>
                    ) : (
                      <div className="items-start">
                        <motion.div 
                          className="flex flex-row items-center space-x-2" 
                          whileHover={{ scale: 1.02 }} 
                          transition={{ type: "tween", stiffness: 100 }}
                        >
                          <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          

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
                  {ConvertTimestampToDateTime(invoice.Timestamp)}
                </span>
              </div>
            ) : (
              // <div className="items-start">
              //   <motion.div className="flex flex-row items-center space-x-2" whileHover={{ scale: 1.02 }} transition={{ type: "tween", stiffness: 100 }} >
              //     <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                  
              //   </motion.div>
              //   <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg z-50">
              //       Created - {ConvertTimestampToDateTime(invoice.Timestamp)}
              //     </span>
              // </div>
              <div className="relative flex items-center group">
                <div className="items-center">
                <span className="bg-orange-100 text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                </div>
                <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg z-50">
                  {ConvertTimestampToDateTime(invoice.Timestamp)}
                </span>
              </div>

            )}
          </div>

          {requestee?.Status === 'Pending' && requestee?.Address === ADDRESS && invoice.InvoiceType !== "PrePaidSigned"
          && invoice.InvoiceType !== "PrePaidScheduled"  &&(
            
            <div className="flex flex-col items-center mb-2">
              <button
                onClick={handlePayInvoice}
                className="bg-[#4318FF] text-white font-semibold py-2 px-4 rounded hover:bg-[#503BC4] transition duration-300 ease-in-out"
              >
                Pay Invoice { FormatBalance( parseInt(requestee.Amount) ) }
              </button>
              
              { QARBALANCE && QARBALANCE > 0 && <span className="text-sm text-[#A3AED0]">Balance: {QARBALANCE} qAR</span>}
            </div>
            
          )}

          { parsedSigners && parsedSigners.some(signer => signer.Address === ADDRESS && signer.Status === 'Pending') && (
            <div className="flex flex-col items-center mb-2">
              <button
                onClick={handleSignInvoice}
                className="bg-[#4318FF] text-white font-semibold py-2 px-4 rounded hover:bg-[#503BC4] transition duration-300 ease-in-out"
              >
                Sign Invoice
              </button>
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
