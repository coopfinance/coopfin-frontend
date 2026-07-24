export interface Group {
  id: string;
  name: string;
  description: string;
  admin: string;
  members: Member[];
  totalContributions: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  rules: CoopRules;
  contractAddresses: ContractAddresses;
}

export interface Member {
  address: string;
  displayName?: string;
  totalContributed: number;
  joinedAt: string;
  isActive: boolean;
  loanBalance: number;
}

export interface Contribution {
  id: string;
  member: string;
  amount: number;
  period: number;
  timestamp: string;
  txHash: string;
}

export interface Loan {
  id: number;
  borrower: string;
  amount: number;
  interestBps: number;
  repaymentDue: string;
  amountRepaid: number;
  status: "Pending" | "Approved" | "Repaid" | "Rejected" | "Defaulted";
  purpose: string;
  requestedAt: string;
  approvedAt?: string;
}

export interface Proposal {
  id: number;
  proposer: string;
  type: "LoanApproval" | "TreasurySpend" | "AddMember" | "RemoveMember" | "UpdateRule" | "General";
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  deadline: string;
  status: "Active" | "Passed" | "Failed" | "Executed";
  createdAt: string;
  payload?: string;
}

export interface Distribution {
  id: number;
  totalProfit: number;
  totalShares: number;
  recipients: string[];
  amounts: number[];
  executedAt: string;
  period: string;
}

export interface CoopRules {
  minContribution: number;
  contributionPeriodDays: number;
  maxLoanMultiplier: number;
  loanInterestBps: number;
  votingQuorum: number;
  votingPeriodDays: number;
  latePenaltyBps: number;
}

export interface ContractAddresses {
  treasury: string;
  loan: string;
  voting: string;
  governance: string;
  dividend: string;
}

export interface Notification {
  id: string;
  recipient: string;
  type: "contribution" | "loan" | "vote" | "distribution";
  description: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalGroups: number;
  totalMembers: number;
  totalContributions: number;
  totalLoansActive: number;
  totalLoansValue: number;
  totalDividendsDistributed: number;
}

export type NotificationType = "contribution" | "loan" | "vote" | "distribution";

export interface Notification {
  id: string;
  type: NotificationType;
  description: string;
  timestamp: string;
  read: boolean;
  recipient: string;
  groupName?: string;
  amount?: number;
}
