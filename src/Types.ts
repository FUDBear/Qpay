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
    Signers: Signer[];
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
    Signers: Signer[];
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
    Timestamp: string;
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
  Type: string;
};

export type SignerCardData = {
  Name: string;
  Address: string;
  Index: number;
  UpdateSigner: (key: keyof SignerCardData, value: string) => void;
  RemoveSigner: () => void;
  Timestamp?: string;
};

  