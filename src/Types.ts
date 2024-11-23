export type Invoice = {
    InvoiceID: string;
    InvoiceType: string;
    Category: string;
    Owner: string;
    OwnerName: string;
    ReceiverName: string;
    ReceiverWallet: string;
    Senders: Sender[];
    Receivers: Receiver[];
    Amount: number;
    Currency: string;
    Status: string;
    Timestamp: string;
    PaidTimestamp: string;
    InvoiceNote: string;
  };

  export type PaidInvoiceData = {
    InvoiceType: string;
    Category: string;
    OwnerName: string;
    SenderName: string;
    SenderWallet: string;
    Receivers: Receiver[];
    Senders: Sender[];
    Currency: string;
    Status: string;
    InvoiceNote: string;
    Total: string;
  };

  export type Sender = {
    Name: string;
    Address: string;
    Amount: string;
    Status: string;
    PaidTimestamp: string;
  };

  export type Receiver = {
    Name: string;
    Address: string;
    Amount: string;
    Status: string;
    ScheduledTimestamp: string;
  };

  export type Signer = {
    Name: string;
    Address: string;
    Status: string;
    SignedTimestamp: string;
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

export type RecieverCardData = {
  Address: string;
  Amount: string;
  Index: number;
  UpdateReciever: (key: keyof RecieverCardData, value: string) => void;
  RemoveReciever: () => void;
  ScheduledTimestamp?: string;
};

  