export type Invoice = {
    InvoiceID: string;
    RequestorName: string;
    RequestorWallet: string;
    RequesteeWallet: string;
    Amount: number;
    Currency: string;
    Status: string;
    Timestamp: string;
    PaidTimestamp: string;
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

export type RequesteeCardProps = {
  Address: string;
  setAddress: (address: string) => void;
  Amount: string;
  setAmount: (amount: string) => void;
};

export type Requestee = {
  Address: string;
  Amount: string;
  Index: number;
  UpdateRequestee: (key: keyof Requestee, value: string) => void;
  RemoveRequestee: () => void;
};

  