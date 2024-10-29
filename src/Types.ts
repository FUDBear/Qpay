export type Invoice = {
    InvoiceID: string;
    RequestorName: string;
    RequestorWallet: string;
    RequesteeWallet: string;
    Amount: number;
    Currency: string;
    Status: string;
    Timestamp: string;
    InvoiceNote: string;
  };
  
  export type TokenInfo = {
    Name: string;
    Anchor: string;
    Ticker: string;
    Logo: string;
  };

  export type Balance = {
    Balance: string;
    Ticker: string;
    Target: string;
  };
  