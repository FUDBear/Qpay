import { dryrun, message, createDataItemSigner, result } from "@permaweb/aoconnect";
import { PermissionType } from 'arconnect';
import {Invoice, PaidInvoiceData} from "./Types"

const QAR = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8";
const QPAY = "cbLiv_6bsPlIIObQhsaZlY4DxCFg-XmCuQLuVF9WsS8";

type Tag = {
    name: string;
    value: string;
  };

export const truncateToDecimals = (num: number, decimals: number): number => {
    const factor = Math.pow(10, decimals);
    return Math.floor(num * factor) / factor;
  };

export const FormatBalance = (balance: number): number => {
    const qarBalance = balance / 1e12;
    return truncateToDecimals(qarBalance, 5);
  };

export const FormatBalanceUSD = (balance: number): string => {
    const qarBalance = balance / 1e12;
    return qarBalance.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

export const FormatBalanceDecimal = (balance: number): string => {
    const qarBalance = balance / 1e12;
    return qarBalance.toFixed(12);
  };
  
  export const TruncateAddress = (address: string | undefined) => {
    if (!address) {
        return "Undefined";
    }
    if (address.length <= 10) {
        return address;
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};


export const ConvertTimestampToDateTime = (timestamp: string) => {
    if (!timestamp || timestamp === "" || timestamp === undefined ) {
        return "No timestamp provided.";
    }
    const date = new Date(parseInt(timestamp, 10) * 1000);
    const formattedDate = date.toLocaleDateString('en-US');
    const formattedTime = date.toLocaleTimeString('en-US');
    return `${formattedDate} ${formattedTime}`;
};

export const GetTableImgSource = (invoice: Invoice, address: string) => {

    if( invoice.Status.toLowerCase() === "paid" ) {
        return "./images/Paid.svg";
    }

    if( invoice.Status.toLowerCase() === "pending" ) {
        return "./images/Pay.svg";
        
        // if( Invoice.RequestorWallet ) {
        //     return "./images/Request.svg";
        // } else {
        //     return "./images/Request.svg";
        // }
    }
    return "./images/Pay.svg";
  }

// export const GetQARBalance = async (address: string): Promise<number> => { 
//     if (address) {
//         console.log( "Fetching balance for :" + address);
//         try {
//             const messageResponse = await dryrun({
//                 process: QAR,
//                 tags: [
//                     { name: 'Action', value: 'Balance' },
//                     { name: 'Recipient', value: address },
//                 ],
//             });

//             console.log("MessageResponse: ", messageResponse);

//             const balanceTag = messageResponse.Messages[0].Tags.find((tag: Tag) => tag.name === 'Balance')
//             const balance = balanceTag ? parseFloat((balanceTag.value / 1000).toFixed(4)) : 0;
//             return balance;

//         } catch (error) {
//             console.error(error);
//             return 0;
//         }
//     } else {
//         console.log("No address provided.");
//         return 0;
//     }
// };

export const SendProcessMessage = async (action: string, data: string ): Promise<string> => { 
    
    console.log("SendProcessMessage: " + action + " : " + data);
    try {
        const getResult = await message({
            process: QAR,
            tags: [
                { name: 'Action', value: action },
            ],
            data: data,
            signer: createDataItemSigner(window.arweaveWallet),
        });
        const { Messages, Error } = await result({
            message: getResult,
            process: QAR,
        });
        if (Error) {
            console.log("Error:" + Error);
            return "Error:" + Error;
        }
        if (!Messages || Messages.length === 0) {
            console.log("No messages were returned from ao. Please try later.");
            return "No messages were returned from ao. Please try later."; 
        }

        console.log("Timestamp: ", Messages[0].Timestamp);

        console.log("Message: ", Messages);
        console.log("Message[0]: ", Messages[0]);
        
        return Messages[0].Data;
    } catch (error) {
        console.log('There was an error adding project: ' + error);
        return "Error";
    }
};


export const SendProcessDryrun = async (action: string, data: string ): Promise<string> => {
    
    try {
        const dryrunResult = await dryrun({
            process: QAR,
            tags: [
                { name: 'Action', value: action },
            ],
            data: data,
            signer: createDataItemSigner(window.arweaveWallet),
        });
    
        if (dryrunResult && dryrunResult.Messages && dryrunResult.Messages.length > 0) {
            const message = dryrunResult.Messages[0];

            console.log( "Message: " , message )
    
            console.log("Anchor: ", message.Anchor);
            console.log("Target: ", message.Target);
            console.log("Timestamp: ", message.Timestamp);
    
            type Tag = {
              name: string;
              value: string;
            };
    
            const tickerTag = message.Tags.find((tag: Tag) => tag.name === "Ticker");
            const tickerValue = tickerTag ? tickerTag.value : "No Ticker";
    
            console.log("Ticker: ", tickerValue);
    
            return JSON.stringify({ anchor: message.Anchor, target: message.Target, ticker: tickerValue });

        } else {
            console.log("No response from dryrun!");
            return "Got no response from dryrun!";
        }
    
    } catch (error) {
        console.log('There was an error during dryrun: ' + error);
        return "Error";
    }
};


export const GetTokenInfo = async (): Promise<string> => {
    
    try {
        const dryrunResult = await dryrun({
            process: QAR,
            tags: [
                { name: 'Action', value: "Info" },
            ],
            data: "",
            signer: createDataItemSigner(window.arweaveWallet),
        });
    
        if (dryrunResult && dryrunResult.Messages && dryrunResult.Messages.length > 0) {
            const message = dryrunResult.Messages[0];
            console.log("Message: ", message);
    
            // console.log("Anchor: ", message.Anchor);
            // console.log("Target: ", message.Target);
    
            // Ticker
            const tickerTag = message.Tags.find((tag: Tag) => tag.name === "Ticker");
            const tickerValue = tickerTag ? tickerTag.value : "No Ticker";
            console.log("Ticker: ", tickerValue);

            // Name
            const nameTag = message.Tags.find((tag: Tag) => tag.name === "Name");
            const nameValue = nameTag ? nameTag.value : "No Ticker";
            console.log("Name: ", nameValue);

            // Logo
            const logoTag = message.Tags.find((tag: Tag) => tag.name === "Logo");
            const logoValue = logoTag ? logoTag.value : "No Logo";
            console.log("Logo: ", logoValue);
            
            // Etc, etc...
            return JSON.stringify({ anchor: message.Anchor, target: message.Target, ticker: tickerValue,
                logo: logoValue
             });

        } else {
            console.log("No response from dryrun!");
            return "Got no response from dryrun!";
        }
    
    } catch (error) {
        console.log('There was an error during dryrun: ' + error);
        return "Error";
    }
};


export const SendPayMessage = async (action: string, data: string ): Promise<string> => { 
    
    console.log("SendPayMessage: " + action + " : " + data);

    try {
        const getResult = await message({
            process: QPAY,
            tags: [
                { name: 'Action', value: action },
            ],
            data: data,
            signer: createDataItemSigner(window.arweaveWallet),
        });
        const { Messages, Error } = await result({
            message: getResult,
            process: QPAY,
        });
        if (Error) {
            console.log("Error:" + Error);
            return "Error:" + Error;
        }
        if (!Messages || Messages.length === 0) {
            console.log("No messages were returned from ao. Please try later.");
            return "No messages were returned from ao. Please try later."; 
        }

        console.log("Timestamp: ", Messages[0].Timestamp);
        console.log("Message: ", Messages);
        console.log("Message[0]: ", Messages[0]);
        
        return Messages[0].Data;
    } catch (error) {
        console.log('There was an error adding project: ' + error);
        return "Error";
    }
};

export const SendInvoicePayment = async ( sender : string, invoiceId: string, amount: string ): Promise<string> => { 

    // verify balance with payment?

    try {
        const paymentData = await message({
            process: QAR,
            tags: [
                { name: 'Action', value: 'Transfer' },
                { name: 'Recipient', value: QPAY },
                { name: 'Quantity', value:  amount },
                { name: 'Sender', value: sender },
                { name: "X-[INVOICEID]", value: invoiceId },
            ],
            signer: createDataItemSigner(window.arweaveWallet),
        });
        const { Messages, Error } = await result({
            message: paymentData,
            process: QAR,
        });
        if (Error) {
            return "Error sending:" + Error;
        }
        if (!Messages || Messages.length === 0) {
            return "No messages were returned from ao. Please try later."; 
        }
        const actionTag = Messages[0].Tags.find((tag: Tag) => tag.name === 'Action')
        if (actionTag.value === "Debit-Notice") {

            // console.log("Debit-Notice Tags: ", Messages[0].Tags);
            // console.log("Debit-Notice Quantity: ", Messages[0].Tags["Quantity"]);
            // console.log("From: ", Messages[0].Target);
    }
        return "Success";
    } catch (error) {
        return "Error";
    }
};

export const SendPaidInvoice = async ( sender: string, quantity: string, data: string ): Promise<string> => { 

    try {
        const paymentData = await message({
            process: QAR,
            tags: [
                { name: 'Action', value: 'Transfer' },
                { name: 'Recipient', value: QPAY },
                { name: 'Quantity', value:  quantity },
                { name: 'Sender', value: sender },
                { name: "X-[PAID_INVOICE]", value: data },
            ],
            signer: createDataItemSigner(window.arweaveWallet),
        });
        const { Messages, Error } = await result({
            message: paymentData,
            process: QAR,
        });
        if (Error) {
            return "Error sending:" + Error;
        }
        if (!Messages || Messages.length === 0) {
            return "No messages were returned from ao. Please try later."; 
        }
        return "Success";
    } catch (error) {
        return "Error";
    }
};

export const GetQARBalance = async (address: string): Promise<number> => { 
    if (address) {
        try {
            const messageResponse = await dryrun({
                process: QAR,
                tags: [
                    { name: 'Action', value: 'Balance' },
                    { name: 'Recipient', value: address },
                    { name: 'Target', value: address },
                ],
            });
            console.log( "messageResponse: " ,messageResponse );
            const balanceTag = messageResponse.Messages[0].Tags.find((tag: Tag) => tag.name === 'Balance')
            const balance = balanceTag ? balanceTag.value : 0;
            console.log( "Balance: " , balance );
            return balance;

        } catch (error) {
            console.error(error);
            return 0;
        }
    } else {
        console.log("No address provided.");
        return 0;
    }
};