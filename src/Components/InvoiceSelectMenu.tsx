import React from 'react'
import Breadcrumbs from './Breadcrumbs';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function InvoiceSelectMenu() {

    const navigate = useNavigate();

    const handleSend = () => {
        navigate("/invoicecreation/send");
    };

    const handleRequest = () => {
        navigate("/invoicecreation/request");
    }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Breadcrumbs />

        <div className="relative p-8 bg-[#ffffff] rounded-lg min-w-[400px] max-w-md mx-auto">

        <div className="flex items-center justify-between mb-4">
            
            <h2 className="text-2xl font-semibold text-[#2b3674]">Select Type</h2>
        
        </div>

        <div className="flex flex-col items-center mb-2 space-y-4">
            
            <button
                onClick={handleSend}
                className="bg-slate-100 min-w-full min-h-40 text-white font-semibold py-2 px-4 rounded hover:bg-slate-200 transition duration-300 ease-in-out" >
                <div className="flex flex-col items-center justify-around mb-4">

                    <motion.img src={'./images/purple_icons/send.svg'} alt="Send Payment" className="w-20 h-20" 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }} />
                    <span className="text-xl font-semibold text-[#2b3674]">
                        Send Payment 
                    </span>

                </div>
            </button>

            <button
                onClick={handleRequest}
                className="bg-slate-100 min-w-full min-h-40 text-white font-semibold py-2 px-4 rounded hover:bg-slate-200 transition duration-300 ease-in-out" >
                <div className="flex flex-col items-center justify-around mb-4">

                    <motion.img src={'./images/purple_icons/request_hand.svg'} alt="Request Payment" className="w-20 h-20" 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }} />
                    <span className="text-xl font-semibold text-[#2b3674]">
                        Request Payment 
                    </span>

                </div>
            </button>

            <button
                className="bg-slate-100 min-w-full min-h-40 text-white font-semibold py-2 px-4 rounded hover:bg-slate-200 transition duration-300 ease-in-out" >
                <div className="flex flex-col items-center justify-around mb-4">

                    <motion.img src={'./images/purple_icons/schedule_send.svg'} alt="Schedule Invoice" className="w-20 h-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }} />
                    <span className="text-xl font-semibold text-[#2b3674]">
                        Schedule Payment 
                    </span>

                </div>
            </button>
            
        </div>
        
      </div>
    </div>
  )
}

export default InvoiceSelectMenu;