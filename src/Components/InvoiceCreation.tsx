import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendPayMessage, FormatBalance } from '../MiscTools';
import { RecieverCardData, Receiver } from '../Types';
import Breadcrumbs from './Breadcrumbs';
import Swal from 'sweetalert2';
import RequesteeCard from './RequesteeCard';
import { AnimatePresence, motion, Variants } from 'framer-motion';

function InvoiceCreation() {
  const { ADDRESS } = useGlobalContext();
  const navigate = useNavigate();

  const [receiverName, setReceiverName] = useState("");
  const [senders, setSenders] = useState<RecieverCardData[]>([
    {
      Address: "",
      Amount: "0.000",
      Index: 0,
      UpdateReciever: (key, value) => handleUpdateRequestee(0, key, value),
      RemoveReciever: () => handleRemoveRequestee(0),
    }
  ]);
  const [receivers, setReceivers] = useState<Receiver[]>([
    { 
      Name: "",
      Address: "",
      Amount: "0.000",
      Status: "Pending", 
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
    setSenders(prev =>
      prev.map((req, i) => (i === index ? { ...req, [key]: value } : req))
    );
  };

  const handleRemoveRequestee = (index: number) => {
    if (senders.length > 1) {
      setSenders(senders.filter((_, i) => i !== index));
    }
  };

  const handleAddRequestee = () => {
    const newRequestee: RecieverCardData = {
      Address: "",
      Amount: "0.000",
      Index: senders.length,
      UpdateReciever: (key, value) => handleUpdateRequestee(senders.length, key, value),
      RemoveReciever: () => handleRemoveRequestee(senders.length),
    };
    setSenders([...senders, newRequestee]);
  };

  const handleCreateInvoice = async () => {
    if (!receiverName || senders.some(req => !req.Address || !req.Amount) || !note) {
      showFail();
      return;
    }

    try {
      if (ADDRESS !== 'disconnected' && window.arweaveWallet) {

        // A fixed invoice w/ only 1 receiver
        const totalAmount = senders.reduce((acc, req) => acc + parseFloat(req.Amount), 0);

        const newInvoice = {
          OwnerName: receiverName,
          ReceiverName: receiverName,
          ReceiverWallet: ADDRESS,
          Senders: senders.map(req => ({
            Address: req.Address,
            Amount: (parseFloat(req.Amount) * 1e12).toFixed(0),
            Status: "Pending",
          })),
          Receivers: [
            {
              Name: receiverName,
              Address: ADDRESS,
              Amount: (totalAmount * 1e12).toFixed(0),
              Status: "Pending",
            }
          ],
          Note: note,
          Currency: "qAR",
        };

        console.log("New Invoice: ", newInvoice);

        const result = await SendPayMessage("Create-New-Invoice", JSON.stringify(newInvoice));
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

  useEffect(() => {
    setReceivers((prevReceivers) => {
      const updatedReceivers = [...prevReceivers];
      updatedReceivers[0] = { ...updatedReceivers[0], Name: receiverName };
      return updatedReceivers;
    });
  } , [receiverName]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Breadcrumbs />

      {/* Spacer */}
      <div className="h-16"></div>

      <div className="relative mt-18 p-8 bg-[#ffffff] rounded-lg min-w-[400px] max-w-md mx-auto overflow-y-auto">
        
        <h2 className="text-2xl font-semibold mb-4 text-[#2b3674]">Create Invoice</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Your Name</label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
              placeholder="Enter requestor name"
              required
            />
          </div>

          <AnimatePresence>
            {senders.map((requestee, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.0 }}
                transition={{ duration: 0.1 }}
                className="flex items-center"
              >
                <RequesteeCard
                  Address={requestee.Address}
                  Amount={requestee.Amount}
                  Index={index}
                  UpdateReciever={(key, value) => handleUpdateRequestee(index, key, value)}
                  RemoveReciever={() => handleRemoveRequestee(index)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex items-center justify-around">
            <button onClick={handleAddRequestee} className="flex text-white rounded-full font-semibold hover:bg-slate-200 transition duration-300 ease-in-out">
              <img src={'./images/purple_icons/add_circle.svg'} alt="Add Invoice Requestee" className="w-8 h-8" />
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
            Create Invoice
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceCreation;
