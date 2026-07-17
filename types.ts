export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  timestamp: string;
}

export interface MoltBookPost {
  id: string;
  author: string;
  ticker: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface PaidTask {
  id: string;
  taskReference: string;
  title: string;
  amount: number;
  currency: string;
  recipientWallet: string;
  status: "pending" | "signed" | "paid";
  txHash?: string;
  timestamp: string;
}

export interface ClawBankBalance {
  token: string;
  amount: number;
  valueUsd: number;
  logoColor: string;
}

export interface OperationalDocument {
  id: string;
  title: string;
  type: "contract" | "strategy";
  content: string;
  signedByOperator: boolean;
  signedBySoloplanet: boolean;
  timestamp: string;
}
