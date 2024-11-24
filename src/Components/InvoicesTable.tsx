import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { useGlobalContext } from '../GlobalProvider';
import { SendPayMessage } from '../MiscTools';
import InvoiceCell from './InvoiceCell';
import { Invoice, Receiver, Sender } from '../Types';
import * as XLSX from 'xlsx';

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

  const ExportFiles = () => {
    if (invoices.length === 0) {
      console.log("No invoices to export.");
      return; 
    } 
  
    const structuredData = invoices.flatMap((invoice) => {
      const senders = typeof invoice.Senders === "string" ? JSON.parse(invoice.Senders) : invoice.Senders || [];
      const receivers = typeof invoice.Receivers === "string" ? JSON.parse(invoice.Receivers) : invoice.Receivers || [];
  
      const baseRow = {
        InvoiceID: invoice.InvoiceID || "N/A",
        OwnerName: invoice.OwnerName || "N/A",
        Amount: invoice.Amount || "N/A",
        InvoiceNote: invoice.InvoiceNote || "N/A",
        Status: invoice.Status || "N/A",
        Timestamp: invoice.Timestamp || "N/A",
      };
  
      const senderRows = senders.map((sender: Sender, index: number) => ({
        InvoiceID: index === 0 ? "Senders" : "",
        OwnerName: "",
        Amount: "",
        InvoiceNote: "",
        Status: "",
        Timestamp: "",
        SenderName: sender.Name || "N/A",
        SenderAddress: sender.Address || "N/A",
        SenderAmount: sender.Amount || "N/A",
        SenderStatus: sender.Status || "N/A",
        SenderPaidTimestamp: sender.PaidTimestamp || "N/A",
      }));
  
      const receiverRows = receivers.map((receiver: Receiver, index: number) => ({
        InvoiceID: index === 0 ? "Receivers" : "",
        OwnerName: "",
        Amount: "",
        InvoiceNote: "",
        Status: "",
        Timestamp: "",
        ReceiverName: receiver.Name || "N/A",
        ReceiverAddress: receiver.Address || "N/A",
        ReceiverAmount: receiver.Amount || "N/A",
        ReceiverStatus: receiver.Status || "N/A",
        ReceiverScheduledTimestamp: receiver.ScheduledTimestamp || "N/A",
      }));
  
      return [
        baseRow,
        ...senderRows,
        ...receiverRows,
        {},
      ];
    });
  
    const worksheet = XLSX.utils.json_to_sheet(structuredData, {
      header: [
        "InvoiceID",
        "OwnerName",
        "Amount",
        "InvoiceNote",
        "Status",
        "Timestamp",
        "SenderName",
        "SenderAddress",
        "SenderAmount",
        "SenderStatus",
        "SenderPaidTimestamp",
        "ReceiverName",
        "ReceiverAddress",
        "ReceiverAmount",
        "ReceiverStatus",
        "ReceiverScheduledTimestamp",
      ],
    });
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
  
    XLSX.writeFile(workbook, "Invoices_Structured.xlsx");
    console.log("Invoices exported successfully.");
  };
  
  

  return (
    <div className="p-8 bg-white rounded-lg min-w-[400px] max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-[#2b3674]">Invoices</h2>
        
        <div className="flex space-x-4">
          
          <div className="relative flex items-center group">
            <button
              onClick={ExportFiles}
              className="flex items-center rounded-xl text-white font-semibold py-2 px-2 hover:bg-gray-200 transition duration-300 ease-in-out"
            >
              <img src={'./images/purple_icons/file_export.svg'} alt="Export Files" className="w-6 h-6" />
            </button>
            <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-300 rounded shadow-lg">
              Download XLSX
            </span>
          </div>

          <Link to="/invoicecreation/">
          <div className="relative flex items-center group">
            <button className="flex items-center rounded-xl text-white font-semibold py-2 px-2 hover:bg-gray-200 transition duration-300 ease-in-out">
              <img src={'./images/new_invoice.svg'} alt="New Invoice" className="w-6 h-6" />
            </button>
            <span className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-300 rounded shadow-lg">
              New Invoice
            </span>
          </div>
          </Link>
        </div>
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