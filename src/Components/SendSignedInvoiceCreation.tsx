import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendPaidInvoice } from '../MiscTools';
import { RecieverCardData, PaidInvoiceData, Sender, Signer, SignerCardData } from '../Types';
import ClipLoader from 'react-spinners/ClipLoader';
import Breadcrumbs from './Breadcrumbs';
import Swal from 'sweetalert2';
import ReceiverCard from './ReceiverCard';
import SignerCard from './SignerCard';
import { AnimatePresence, motion, Variants } from 'framer-motion';

function SendSignedInvoiceCreation() {

  const { ADDRESS } = useGlobalContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [senderAmount, setSenderAmount] = useState(0);
  const [senders, setSenders] = useState<Sender[]>([
    {
      Name: "",
      Address: "",
      Amount: "0.000",
      Status: "Pending",
      PaidTimestamp: "",
    }
  ]);
  const [receivers, setReceivers] = useState<RecieverCardData[]>([
    {
        Address: "",
        Amount: "0.000",
        Index: 0,
        UpdateReciever: (key, value) => handleUpdateRequestee(0, key, value),
        RemoveReciever: () => handleRemoveRequestee(0),
        ScheduledTimestamp: "",
        Type: "PrePaidSigned",
    }
  ]);
  const [signers, setSigners] = useState<SignerCardData[]>([
    {
        Name: "",
        Address: "",
        Index: 0,
        UpdateSigner: (key, value) => handleUpdateSigner(0, key, value),
        RemoveSigner: () => handleRemoveSigner(0),
        Timestamp: "",
    }
  ]);
  const [note, setNote] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const itemVariants: Variants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    closed: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  };

  const showSuccess = () => {
    Swal.fire({
      title: 'Success!',
      text: 'Your invoice has been successfully created',
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
      text: 'Please fill out all fields or check your connection',
      color: "black",
      icon: 'error',
      confirmButtonText: 'Done',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/");
      }
    });
  };

  const handleUpdateRequestee = (index: number, key: keyof RecieverCardData, value: string) => {
    setReceivers(prev =>
      prev.map((req, i) => (i === index ? { ...req, [key]: value } : req))
    );
  };

  const handleRemoveRequestee = (index: number) => {
    if (receivers.length > 1) {
      setReceivers(receivers.filter((_, i) => i !== index));
    }
  };

  const handleAddRequestee = () => {
    const newRequestee: RecieverCardData = {
        Address: "",
        Amount: "0.000",
        Index: receivers.length,
        UpdateReciever: (key, value) => handleUpdateRequestee(receivers.length, key, value),
        RemoveReciever: () => handleRemoveRequestee(receivers.length),
        Type: "PrePaidSigned",
    };
    setReceivers([...receivers, newRequestee]);
  };

  const handleUpdateSigner = (index: number, key: keyof SignerCardData, value: string) => {
    setSigners(prev =>
      prev.map((req, i) => (i === index ? { ...req, [key]: value } : req))
    );
  };

  const handleRemoveSigner = (index: number) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
    }
  };

  const handleAddSigner = () => {
    const newSigner: SignerCardData = {
        Name: "",
        Address: "",
        Index: 0,
        UpdateSigner: (key, value) => handleUpdateSigner(0, key, value),
        RemoveSigner: () => handleRemoveSigner(0),
        Timestamp: "",
    };
    setSigners([...signers, newSigner]);
  };

  useEffect(() => {
    if (receivers.length > 0) {
        let total = 0;
        for(let i = 0; i < receivers.length; i++) {
          total += parseFloat(receivers[i].Amount);
        }
        setSenderAmount(total);
    }
  } , [receivers]);

  const handleCreateInvoice = async () => {

    setLoading(true);

    if (!senderName || receivers.some(req => !req.Address || !req.Amount) || !note) {
      showFail();
      return;
    }

    try {
      // Here the values are flipped, the requestor is the sender and the requestees are the receivers
      if (ADDRESS !== 'disconnected' && window.arweaveWallet) {

        // Create a new Sender
        const newSender = { 
          Name: senderName,  
          Address: ADDRESS, 
          Amount: senderAmount, 
          Status: "Pending" 
        };

        // for (let i = 0; i < receivers.length; i++) {
        //   const newReciever = { 
        //     Address: receivers[i].Address, 
        //     Amount: (parseFloat(receivers[i].Amount) * 1e12).toFixed(0), 
        //     Status: "Pending" };
        // }

        // const total = senders.reduce((acc, req) => acc + parseFloat(req.Amount), 0);
        let total = 0;
        for(let i = 0; i < receivers.length; i++) {
          total += parseFloat(receivers[i].Amount);
        }
        
        const newInvoice : PaidInvoiceData = {
          InvoiceType: "PrePaidSigned",
          Category: "Unknown",
          OwnerName: newSender.Name,
          SenderName: newSender.Name,
          SenderWallet: newSender.Address,
          Status: newSender.Status,
          Receivers: receivers.map(req => ({
            Name: "",
            Address: req.Address,
            Amount: (parseFloat(req.Amount) * 1e12).toFixed(0),
            Status: "Pending",
            ScheduledTimestamp: req.ScheduledTimestamp? req.ScheduledTimestamp : "",
          })),
          Senders: [
            {
              Name: newSender.Name,
              Address: newSender.Address,
              Amount: (parseFloat(newSender.Amount.toString()) * 1e12).toFixed(0),
              Status: "Pending",
              PaidTimestamp: ""
            }
          ],
          Signers: signers.map( signer => ({
            Name: "",
            Address: signer.Address,
            Status: "Pending",
            Timestamp: "",
          })),
          Total: (total * 1e12).toFixed(0),
          InvoiceNote: note,
          Currency: "qAR",
        };

        console.log("New PAID_INVOICE: ", JSON.stringify(newInvoice));

        const result = await SendPaidInvoice( newInvoice.SenderWallet, newInvoice.Total,
           JSON.stringify(newInvoice));
        console.log("Result: ", result);

        if(result === "Success") {
          showSuccess();
        } else {
          showFail();
        }

      } else {
        console.log("ArConnect is not installed.");
      }
    } catch (error) {
      console.error("Failed to create invoice: ", error);
      showFail();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <ClipLoader color="#4318FF" loading={loading} size={50} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">

      <Breadcrumbs />

      {/* Spacer */}
      <div className="h-16"></div>

      <div className="relative p-8 bg-[#ffffff] rounded-lg min-w-[400px] max-w-md mx-auto">
        
      <h2 className="text-2xl font-semibold mb-4 text-[#2b3674]">Signed Payment</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Your Name</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
              placeholder="Enter Your Name"
              required
            />
          </div>

          <AnimatePresence>
            {receivers.map((r, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.0 }}
                transition={{ duration: 0.1 }}
                className="flex items-center"
              >
                <ReceiverCard
                  Address={r.Address}
                  Amount={r.Amount}
                  Index={index}
                  UpdateReciever={(key, value) => handleUpdateRequestee(index, key, value)}
                  RemoveReciever={() => handleRemoveRequestee(index)}
                  Type='PrePaidSigned'
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {signers.map((signer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.0 }}
                transition={{ duration: 0.1 }}
                className="flex items-center"
              >
                <SignerCard
                    Name={signer.Name}
                    Address={signer.Address}
                    Index={index}
                    UpdateSigner={(key, value) => handleUpdateSigner(index, key, value)}
                    RemoveSigner={() => handleRemoveSigner(index)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex items-center justify-around">
            <button onClick={handleAddSigner} className="flex text-white rounded-full font-semibold hover:bg-slate-200 transition duration-300 ease-in-out">
              <img src={'./images/purple_icons/add_circle.svg'} alt="Add Invoice Reciever" className="w-8 h-8" />
            </button>
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

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.6 }} onClick={handleCreateInvoice}
            className="bg-[#4318FF] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#503BC4] transition ease-in-out duration-200 shadow-lg mt-4 w-full"
          >
            Send Payment

            { senderAmount > 0 && <span className="text-sm text-[#A3AED0]"> {senderAmount} qAR</span>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default SendSignedInvoiceCreation;
