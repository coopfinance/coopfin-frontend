"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, notFound } from "next/navigation";
import {
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  Copy,
  Plus,
  Check,
  ExternalLink,
  User,
  Coins,
  Calendar,
  Hash,
  Circle,
  ArrowUpRight,
  Wallet,
  Building2,
} from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";
import { useState, useCallback } from "react";
import { LoanCard } from "@/components/loans/loan-card";
import { ProposalCard } from "@/components/governance/proposal-card";
import { shortenAddress, formatAmount } from "@/lib/stellar";
import { useWallet } from "@/hooks/use-wallet";
import type { Group, Member, Contribution, Loan, Proposal } from "@/types";

/* ------------------------------------------------------------------ */
/* Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_GROUP: Group = {
  id: "mock-1",
  name: "Eko Savings Circle",
  description:
    "A community savings cooperative focused on supporting small business growth in Lagos. Members contribute 50 USDC monthly and can access low-interest loans.",
  admin: "GBXUQK2Q3Z7N7XK5Y5V5Q5Z5X5Y5Z5X5Y5Z5X5Y5Z5",
  members: [
    { address: "GABC123…DEF1", displayName: "Adaeze Okonkwo", totalContributed: 500, joinedAt: "2025-01-15T10:00:00Z", isActive: true, loanBalance: 0 },
    { address: "GDEF456…GHI2", displayName: "Chidi Okafor", totalContributed: 450, joinedAt: "2025-01-20T10:00:00Z", isActive: true, loanBalance: 200 },
    { address: "GGHI789…JKL3", displayName: "Efe Johnson", totalContributed: 400, joinedAt: "2025-02-05T10:00:00Z", isActive: true, loanBalance: 0 },
    { address: "GJKL012…MNO4", displayName: "Fatima Bello", totalContributed: 350, joinedAt: "2025-02-18T10:00:00Z", isActive: true, loanBalance: 150 },
    { address: "GMNO345…PQR5", displayName: "Gabriel Musa", totalContributed: 300, joinedAt: "2025-03-01T10:00:00Z", isActive: false, loanBalance: 0 },
  ],
  totalContributions: 2000,
  balance: 1800,
  isActive: true,
  createdAt: "2025-01-10T08:00:00Z",
  rules: {
    minContribution: 50,
    contributionPeriodDays: 30,
    maxLoanMultiplier: 3,
    loanInterestBps: 500,
    votingQuorum: 3,
    votingPeriodDays: 7,
    latePenaltyBps: 100,
  },
  contractAddresses: {
    treasury: "CDLZ6Y5Q5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5",
    loan: "CDLZ6Y5Q5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5",
    voting: "CDLZ6Y5Q5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5",
    governance: "CDLZ6Y5Q5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5",
    dividend: "CDLZ6Y5Q5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5Z5X5Y5",
  },
};

const MOCK_MEMBERS: Member[] = MOCK_GROUP.members as Member[];

const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: "c1", member: "GABC123…DEF1", amount: 50, period: 1, timestamp: "2025-02-01T10:00:00Z", txHash: "abc123def456" },
  { id: "c2", member: "GDEF456…GHI2", amount: 50, period: 1, timestamp: "2025-02-01T10:05:00Z", txHash: "def789ghi012" },
  { id: "c3", member: "GGHI789…JKL3", amount: 50, period: 1, timestamp: "2025-02-02T09:30:00Z", txHash: "ghi345jkl678" },
  { id: "c4", member: "GABC123…DEF1", amount: 50, period: 2, timestamp: "2025-03-01T10:00:00Z", txHash: "jkl901mno234" },
  { id: "c5", member: "GDEF456…GHI2", amount: 50, period: 2, timestamp: "2025-03-01T10:10:00Z", txHash: "mno567pqr890" },
  { id: "c6", member: "GJKL012…MNO4", amount: 50, period: 2, timestamp: "2025-03-02T11:00:00Z", txHash: "pqr123stu456" },
  { id: "c7", member: "GABC123…DEF1", amount: 100, period: 3, timestamp: "2025-04-01T10:00:00Z", txHash: "stu789vwx012" },
  { id: "c8", member: "GGHI789…JKL3", amount: 50, period: 3, timestamp: "2025-04-01T10:30:00Z", txHash: "vwx345yza678" },
];

const MOCK_LOANS: Loan[] = [
  { id: 1, borrower: "GDEF456…GHI2", amount: 200, interestBps: 500, repaymentDue: "2025-06-01T10:00:00Z", amountRepaid: 50, status: "Approved", purpose: "School fees for children", requestedAt: "2025-03-15T10:00:00Z" },
  { id: 2, borrower: "GJKL012…MNO4", amount: 150, interestBps: 500, repaymentDue: "2025-07-15T10:00:00Z", amountRepaid: 0, status: "Pending", purpose: "Market stall restock", requestedAt: "2025-04-10T10:00:00Z" },
  { id: 3, borrower: "GABC123…DEF1", amount: 300, interestBps: 400, repaymentDue: "2025-05-01T10:00:00Z", amountRepaid: 300, status: "Repaid", purpose: "Emergency medical expense", requestedAt: "2025-02-20T10:00:00Z" },
  { id: 4, borrower: "GMNO345…PQR5", amount: 100, interestBps: 500, repaymentDue: "2025-08-01T10:00:00Z", amountRepaid: 0, status: "Defaulted", purpose: "Business expansion", requestedAt: "2025-04-01T10:00:00Z" },
];

const MOCK_PROPOSALS: Proposal[] = [
  { id: 1, proposer: "GABC123…DEF1", type: "LoanApproval", title: "Approve 200 USDC loan for Chidi", description: "Chidi Okafor has requested a 200 USDC loan for school fees. Interest rate: 5%", votesFor: 3, votesAgainst: 1, quorum: 3, deadline: "2025-05-01T10:00:00Z", status: "Active", createdAt: "2025-04-20T10:00:00Z" },
  { id: 2, proposer: "GGHI789…JKL3", type: "UpdateRule", title: "Increase contribution period to 45 days", description: "Proposal to extend the contribution period from 30 to 45 days to accommodate members with irregular income.", votesFor: 4, votesAgainst: 0, quorum: 3, deadline: "2025-04-15T10:00:00Z", status: "Passed", createdAt: "2025-04-08T10:00:00Z" },
  { id: 3, proposer: "GDEF456…GHI2", type: "TreasurySpend", title: "Allocate 100 USDC for group event", description: "Proposal to spend 100 USDC from treasury for a group networking event.", votesFor: 2, votesAgainst: 2, quorum: 3, deadline: "2025-04-10T10:00:00Z", status: "Failed", createdAt: "2025-04-03T10:00:00Z" },
];

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

// TODO: connect to real API — replace mock data with GET /api/groups/:id
async function fetchGroup(id: string): Promise<Group> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("NOT_FOUND");
      throw new Error("Failed to fetch group");
    }
    const data: unknown = await res.json();
    if (!data || typeof data !== "object") throw new Error("Invalid response");
    return data as Group;
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") throw err;
    // TODO: Remove mock fallback once API is available
    return MOCK_GROUP;
  }
}

// TODO: connect to real API — replace mock data with GET /api/groups/:id/members
async function fetchMembers(id: string): Promise<Member[]> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(id)}/members`);
    if (!res.ok) throw new Error("Failed to fetch members");
    return (await res.json()) as Member[];
  } catch {
    return MOCK_MEMBERS;
  }
}

// TODO: connect to real API — replace mock data with GET /api/groups/:id/contributions
async function fetchContributions(id: string): Promise<Contribution[]> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(id)}/contributions`);
    if (!res.ok) throw new Error("Failed to fetch contributions");
    return (await res.json()) as Contribution[];
  } catch {
    return MOCK_CONTRIBUTIONS;
  }
}

// TODO: connect to real API — replace mock data with GET /api/groups/:id/loans
async function fetchLoans(id: string): Promise<Loan[]> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(id)}/loans`);
    if (!res.ok) throw new Error("Failed to fetch loans");
    return (await res.json()) as Loan[];
  } catch {
    return MOCK_LOANS;
  }
}

// TODO: connect to real API — replace mock data with GET /api/groups/:id/proposals
async function fetchProposals(id: string): Promise<Proposal[]> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(id)}/proposals`);
    if (!res.ok) throw new Error("Failed to fetch proposals");
    return (await res.json()) as Proposal[];
  } catch {
    return MOCK_PROPOSALS;
  }
}

/* ------------------------------------------------------------------ */
/* Stellar Expert link helper                                          */
/* ------------------------------------------------------------------ */

const STELLAR_EXPLORER = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "MAINNET"
  ? "https://stellar.expert/explorer/public"
  : "https://stellar.expert/explorer/testnet";

function explorerTxLink(txHash: string): string {
  return `${STELLAR_EXPLORER}/tx/${txHash}`;
}

/* ------------------------------------------------------------------ */
/* Copy button helper                                                  */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-100 transition-colors"
      aria-label="Copy address"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-96 bg-gray-100 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 404 state                                                           */
/* ------------------------------------------------------------------ */

function NotFoundState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <Building2 className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Group Not Found</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        This group doesn&apos;t exist or may have been removed. Check the group ID or browse available groups.
      </p>
      <a
        href="/groups"
        className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        <ArrowUpRight className="w-4 h-4" />
        Browse Groups
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state for tabs                                                */
/* ------------------------------------------------------------------ */

function TabEmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Group Detail Page                                                   */
/* ------------------------------------------------------------------ */

export default function GroupDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { address } = useWallet();

  const {
    data: group,
    isLoading,
    isError,
    error,
  } = useQuery<Group>({
    queryKey: ["group", id],
    queryFn: () => fetchGroup(id),
    enabled: !!id,
    retry: 1,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["group-members", id],
    queryFn: () => fetchMembers(id),
    enabled: !!id,
  });

  const { data: contributions = [] } = useQuery<Contribution[]>({
    queryKey: ["group-contributions", id],
    queryFn: () => fetchContributions(id),
    enabled: !!id,
  });

  const { data: loans = [] } = useQuery<Loan[]>({
    queryKey: ["group-loans", id],
    queryFn: () => fetchLoans(id),
    enabled: !!id,
  });

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["group-proposals", id],
    queryFn: () => fetchProposals(id),
    enabled: !!id,
  });

  /* ---- 404 check ---- */
  if (isError && error instanceof Error && error.message === "NOT_FOUND") {
    return <NotFoundState />;
  }

  if (isLoading || !group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  const isAdmin = address === group.admin;
  const activeLoans = loans.filter((l) => l.status === "Approved" || l.status === "Pending").length;
  const totalContributions = group.totalContributions;

  const memberName = (addr: string): string => {
    const m = members.find((mem) => mem.address.startsWith(addr.slice(0, 12)));
    return m?.displayName ?? shortenAddress(addr);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ---- Header ---- */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {group.name}
                </h1>
                <span
                  className={clsx(
                    "text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0",
                    group.isActive
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  )}
                >
                  {group.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4 max-w-2xl">{group.description}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                {/* Admin address */}
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-700 mr-1">Admin:</span>
                  <code className="text-xs bg-gray-50 px-1.5 py-0.5 rounded font-mono">
                    {shortenAddress(group.admin, 6)}
                  </code>
                  <CopyButton text={group.admin} />
                </div>
                {/* Created */}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}</span>
                </div>
                {/* Members count */}
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>{members.length} members</span>
                </div>
              </div>
            </div>

            {/* Add Member button (admin only) */}
            {isAdmin && (
              <button
                type="button"
                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex-shrink-0"
                // TODO: Wire up to AddMemberModal when implemented
                onClick={() => {
                  // Placeholder: will be replaced with modal
                  alert("Add Member modal — to be implemented");
                }}
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>
        </div>

        {/* ---- Stats Row ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-brand-100 p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Treasury Balance</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              ${formatAmount(group.balance)}
            </p>
            {/* TODO: Replace with live Soroban RPC balance */}
            <p className="text-xs text-gray-400 mt-0.5">USDC on Stellar</p>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Members</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{members.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {members.filter((m) => m.isActive).length} active
            </p>
          </div>

          <div className="bg-white rounded-xl border border-amber-100 p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Loans</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeLoans}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {loans.length} total loans requested
            </p>
          </div>

          <div className="bg-white rounded-xl border border-purple-100 p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Contributions</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              ${formatAmount(totalContributions)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Lifetime total</p>
          </div>
        </div>

        {/* ---- Tabs ---- */}
        <Tabs.Root defaultValue="members" className="bg-white rounded-xl border border-gray-200">
          <Tabs.List className="flex border-b border-gray-200 overflow-x-auto">
            <Tabs.Trigger
              value="members"
              className="flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 data-[state=active]:bg-white transition-colors whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              Members
            </Tabs.Trigger>
            <Tabs.Trigger
              value="contributions"
              className="flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 data-[state=active]:bg-white transition-colors whitespace-nowrap"
            >
              <Coins className="w-4 h-4" />
              Contributions
            </Tabs.Trigger>
            <Tabs.Trigger
              value="loans"
              className="flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 data-[state=active]:bg-white transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              Loans
            </Tabs.Trigger>
            <Tabs.Trigger
              value="governance"
              className="flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 data-[state=active]:bg-white transition-colors whitespace-nowrap"
            >
              <Hash className="w-4 h-4" />
              Governance
            </Tabs.Trigger>
          </Tabs.List>

          {/* ---- Members Tab ---- */}
          <Tabs.Content value="members" className="p-4 sm:p-6">
            {members.length === 0 ? (
              <TabEmptyState icon={Users} message="No members yet. Invite members to join this group." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Member</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Address</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Contributed</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Loan Balance</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Joined</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {members.map((member) => (
                      <tr key={member.address} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium text-gray-900">
                          {member.displayName || "Unnamed"}
                        </td>
                        <td className="py-3 px-2">
                          <code className="text-xs bg-gray-50 px-1.5 py-0.5 rounded font-mono text-gray-600">
                            {shortenAddress(member.address, 6)}
                          </code>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-sm text-gray-700">
                          ${formatAmount(member.totalContributed)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-sm">
                          {member.loanBalance > 0 ? (
                            <span className="text-amber-600">${formatAmount(member.loanBalance)}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right text-xs text-gray-500">
                          {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                              member.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            )}
                          >
                            <Circle
                              className={clsx(
                                "w-1.5 h-1.5 fill-current",
                                member.isActive ? "text-green-500" : "text-gray-400"
                              )}
                            />
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>

          {/* ---- Contributions Tab ---- */}
          <Tabs.Content value="contributions" className="p-4 sm:p-6">
            {contributions.length === 0 ? (
              <TabEmptyState icon={Coins} message="No contributions yet. Members can contribute once the group is active." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Member</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Amount</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Period</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contributions.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 font-medium text-gray-900">
                          {memberName(c.member)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-sm text-gray-700">
                          ${formatAmount(c.amount)}
                        </td>
                        <td className="py-3 px-2 text-right text-sm text-gray-600">
                          #{c.period}
                        </td>
                        <td className="py-3 px-2 text-right text-xs text-gray-500">
                          {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <a
                            href={explorerTxLink(c.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {c.txHash.slice(0, 8)}...
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>

          {/* ---- Loans Tab ---- */}
          <Tabs.Content value="loans" className="p-4 sm:p-6">
            {loans.length === 0 ? (
              <TabEmptyState icon={CreditCard} message="No loans in this group yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            )}
          </Tabs.Content>

          {/* ---- Governance Tab ---- */}
          <Tabs.Content value="governance" className="p-4 sm:p-6">
            {proposals.length === 0 ? (
              <TabEmptyState icon={Hash} message="No proposals yet. Members can create proposals to govern the group." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
