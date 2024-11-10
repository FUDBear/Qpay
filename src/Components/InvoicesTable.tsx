import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { useGlobalContext } from '../GlobalProvider';
import { SendPayMessage } from '../MiscTools';
import InvoiceCell from './InvoiceCell';
import { Invoice } from '../Types';

function InvoicesTable() {
  const { ADDRESS } = useGlobalContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      
      try {
        const data = { Address: ADDRESS };
        const result = await SendPayMessage("Get-Address-Invoices", JSON.stringify(data));
        const parsedResult: Invoice[] = JSON.parse(result);
        
        const invoicesWithImages = parsedResult.map(invoice => ({
          ...invoice,
          imageUrl: 'https://via.placeholder.com/50'
        }));
        
        setInvoices(invoicesWithImages);
      } catch (error) {
        console.log("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();

  }, [ADDRESS]);

  return (
    <div className="p-8 bg-white rounded-lg min-w-[400px] max-w-4xl mx-auto">
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-[#2b3674]">Invoices</h2>
        
        <Link to="/invoicecreation/">
        
        <div className="relative flex items-center group">
          <button className="flex items-center rounded-xl text-white font-semibold py-2 px-2 hover:bg-gray-200 transition duration-300 ease-in-out">
            <img src={'./images/new_invoice.svg'} alt="New Invoice" className="w-6 h-6" />
          </button>
          <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-400 rounded shadow-lg">
            New Invoice
          </span>
        </div>
          
        </Link>
      </div>

      <div className="overflow-x-auto w-full max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <ClipLoader color="#4318FF" loading={loading} size={50} />
          </div>
        ) : invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <InvoiceCell key={invoice.InvoiceID} invoice={invoice} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No invoices found.</p>
        )}
      </div>
    </div>
  );
}

export default InvoicesTable;
