import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendPayMessage, FormatBalance } from '../MiscTools';
import { Requestee } from '../Types';
import Breadcrumbs from './Breadcrumbs';
import Swal from 'sweetalert2';
import RequesteeCard from './RequesteeCard';
import { AnimatePresence, motion } from 'framer-motion';

function InvoiceCreation() {
  const { ADDRESS } = useGlobalContext();
  const navigate = useNavigate();

  const [requestorName, setRequestorName] = useState("");
  const [requestees, setRequestees] = useState<Requestee[]>([]);
  const [note, setNote] = useState("");

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

  const handleUpdateRequestee = (index: number, key: keyof Requestee, value: string) => {
    setRequestees(prev =>
      prev.map((req, i) => (i === index ? { ...req, [key]: value } : req))
    );
  };

  const handleRemoveRequestee = (index: number) => {
    setRequestees(requestees.filter((_, i) => i !== index));
  };

  const handleAddRequestee = () => {
    const newRequestee: Requestee = {
      Address: "",
      Amount: "0.000",
      Index: requestees.length,
      UpdateRequestee: (key, value) => handleUpdateRequestee(requestees.length, key, value),
      RemoveRequestee: () => handleRemoveRequestee(requestees.length),
    };
    setRequestees([...requestees, newRequestee]);
  };

  const handleCreateInvoice = async () => {
    if (!requestorName || requestees.some(req => !req.Address || !req.Amount) || !note) {
      showFail();
      return;
    }

    try {
      if (ADDRESS !== 'disconnected' && window.arweaveWallet) {
        const newInvoice = {
          RequestorName: requestorName,
          RequestorAddress: ADDRESS,
          Requestees: requestees.map(req => ({
            Address: req.Address,
            Amount: (parseFloat(req.Amount) * 1e12).toFixed(0),
          })),
          Note: note,
          Currency: "qAR",
        };

        console.log(newInvoice);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Breadcrumbs />

      <div className="p-8 bg-[#ffffff] rounded-lg min-w-[400px] max-w-md mx-auto">
        <h2 className="text-2xl font-semibold mb-4 text-[#2b3674]">Create New Invoice</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Your Name</label>
            <input
              type="text"
              value={requestorName}
              onChange={(e) => setRequestorName(e.target.value)}
              className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
              placeholder="Enter requestor name"
              required
            />
          </div>

          <AnimatePresence>
            {requestees.map((requestee, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <RequesteeCard
                  Address={requestee.Address}
                  Amount={requestee.Amount}
                  Index={index}
                  UpdateRequestee={(key, value) => handleUpdateRequestee(index, key, value)}
                  RemoveRequestee={() => handleRemoveRequestee(index)}
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

          <button
            onClick={handleCreateInvoice}
            className="bg-[#4318FF] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#503BC4] transition ease-in-out duration-200 shadow-lg mt-4 w-full"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}


export default InvoiceCreation;
