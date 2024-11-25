import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendPaidInvoice, FormatBalance } from '../MiscTools';
import { RecieverCardData, PaidInvoiceData, Sender } from '../Types';
import Breadcrumbs from './Breadcrumbs';
import Swal from 'sweetalert2';
import ReceiverCard from './ReceiverCard';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import DatePickerToTimestamp from "./DatePickerToTimestamp";

function ScheduledPaidInvoiceCreation() {
  const { ADDRESS } = useGlobalContext();
  const navigate = useNavigate();

  const [senderName, setSenderName] = useState("");
  const [senderAmount, setSenderAmount] = useState("0.000");
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
      Type: 'PrePaidScheduled',
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
      Type: 'PrePaidScheduled',
    };
    setReceivers([...receivers, newRequestee]);
  };

  useEffect(() => {
    if (receivers.length === 0) {
        let total = 0;
        for(let i = 0; i < receivers.length; i++) {
          total += parseFloat(receivers[i].Amount);
        }

        setSenderAmount(total.toString());
    }
  } , [receivers]);

  const handleCreateInvoice = async () => {
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

        for (let i = 0; i < receivers.length; i++) {
          const newReciever = { Address: receivers[i].Address, Amount: (parseFloat(receivers[i].Amount) * 1e12).toFixed(0), Status: "Pending" };
        }

        let total = 0;
        for(let i = 0; i < receivers.length; i++) {
          total += parseFloat(receivers[i].Amount);
        }

        setSenderAmount(total.toString());
        
        const newInvoice : PaidInvoiceData = {
          InvoiceType: "PrePaidScheduled",
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
            ScheduledTimestamp: "",
          })),
          Senders: [
            {
                Name: newSender.Name,
                Address: newSender.Address,
                Amount: (parseFloat(newSender.Amount) * 1e12).toFixed(0),
                Status: "Pending",
                PaidTimestamp: "",
            }
          ],
          Signers: [],
          Total: (total * 1e12).toFixed(0),
          InvoiceNote: note,
          Currency: "qAR",
        };

        console.log("New PAID_INVOICE: ", JSON.stringify(newInvoice));

        const result = await SendPaidInvoice( newInvoice.SenderWallet, newInvoice.Total,
           JSON.stringify(newInvoice));
        console.log("Result: ", result);
        showSuccess();
      } else {
        console.log("ArConnect is not installed.");
      }
    } catch (error) {
      console.error("Failed to create invoice: ", error);
      showFail();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">

      <Breadcrumbs />

      {/* Spacer */}
      <div className="h-16"></div>

      <div className="relative p-8 bg-[#ffffff] rounded-lg min-w-[400px] max-w-md mx-auto">
        
      <h2 className="text-2xl font-semibold mb-4 text-[#2b3674]">Schedule Payment</h2>

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

          <div className="flex justify-center items-center bg-gray-50">
            {/* <DatePickerToTimestamp /> */}
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
                  Type={'PrePaidScheduled'}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* <div className="flex items-center justify-around">
            <button onClick={handleAddRequestee} className="flex text-white rounded-full font-semibold hover:bg-slate-200 transition duration-300 ease-in-out">
              <img src={'./images/purple_icons/add_circle.svg'} alt="Add Invoice Reciever" className="w-8 h-8" />
            </button>
          </div> */}

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
            Send Payment { FormatBalance( parseInt(senderAmount) ) }
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default ScheduledPaidInvoiceCreation;
