import React from 'react';
import { RequesteeCardData } from "../Types";
import Swal from 'sweetalert2';

const RecieverCard: React.FC<RequesteeCardData> = ({ Address, Amount, UpdateRequestee, RemoveRequestee, Index}) => {
  const showDeleteConfirm = () => {

    Swal.fire({
        title: 'Delete Payment Receiver?',
        text: 'Are you sure you want to delete this payment receiver?',
        color: "black",
        icon: 'question',
        confirmButtonText: 'Yes',
        confirmButtonColor: '#4318FF',
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
            RemoveRequestee();
        }
      });
  };

  return (
    <div className="bg-slate-50 shadow-lg rounded-lg p-6 w-full relative">
      
      {Index !== 0 && (
        <button
          onClick={showDeleteConfirm}
          className="absolute top-3 right-3 flex items-center rounded-lg text-white font-semibold p-2 hover:bg-gray-200 transition duration-300 ease-in-out"
        >
          <img src={'./images/purple_icons/delete.svg'} alt="Delete Invoice" className="w-6 h-6" />
        </button>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Send Q-AR To</label>
        <input
          type="text"
          value={Address}
          onChange={(e) => UpdateRequestee("Address", e.target.value)}
          className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
          placeholder="Enter requestee address"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-bold mb-2">Amount</label>
        <input
            type="text"
            value={Amount}
            onChange={(e) => {
            const value = e.target.value;
            if (/^\d*\.?\d*$/.test(value)) {
                UpdateRequestee("Amount", value);
            }
            }}
            className="border bg-slate-100 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF]"
            placeholder="Enter requested amount"
            required
        />
    </div>


    </div>
  );
};

export default RecieverCard;
