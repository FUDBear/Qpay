import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../GlobalProvider';
import { SendPayMessage, FormatBalance } from '../MiscTools';
import Breadcrumbs from './Breadcrumbs';
import { debug } from 'console';
import Swal from 'sweetalert2';

function InvoiceCreation() {

  const { ADDRESS } = useGlobalContext();
  const navigate = useNavigate();

  const [requestorName, setRequestorName] = useState("");
  const [requesteeAddress, setRequesteeAddress] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("0.000");
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    inputValue = inputValue.replace(/[^0-9.]/g, '');
    if (inputValue.includes('.')) {
      const [integerPart, decimalPart] = inputValue.split('.');
      inputValue = integerPart + '.' + (decimalPart || "").slice(0, 3);
    }

    const numericValue = parseFloat(inputValue);
    if (numericValue < 0.001 && numericValue !== 0) {
      inputValue = "0.001";
    }

    setRequestedAmount(inputValue || "0.000");
  };

  const handleCreateInvoice = async () => {
    if (!requestorName || !requesteeAddress || !requestedAmount || !note) {
      showFail();
      return;
    }

    try {
      if (ADDRESS !== 'disconnected' && window.arweaveWallet) {
        const scaledAmount = (parseFloat(requestedAmount) * 1e12).toFixed(0);

        const newInvoice = {
          RequestorName: requestorName,
          RequestorAddress: ADDRESS,
          RequesteeAddress: requesteeAddress,
          Note: note,
          Amount: scaledAmount,
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
        <Breadcrumbs/>

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

            <div>
            <label className="block text-gray-700 font-bold mb-2">Request Q-AR From</label>
            <input
                type="text"
                value={requesteeAddress}
                onChange={(e) => setRequesteeAddress(e.target.value)}
                className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
                placeholder="Enter requestee address"
                required
            />
            </div>

            <div>
            <label className="block text-gray-700 font-bold mb-2">Amount</label>
            <input
                type="text"
                value={requestedAmount}
                onChange={handleAmountChange}
                className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
                placeholder="Enter requested amount"
                required
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
