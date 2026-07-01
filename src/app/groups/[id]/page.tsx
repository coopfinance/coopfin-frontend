"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Users,
  DollarSign,
  CreditCard,
  HandCoins,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatCard } from "@/components/dashboard/stat-card";
import { LoanCard } from "@/components/loans/loan-card";
import { ProposalCard } from "@/components/governance/proposal-card";
import { formatAmount, shortenAddress } from "@/lib/stellar";
import type { Group, Member, Contribution, Loan, Proposal } from "@/types";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_GROUP: Group = {
  id: "grp_001",
  name: "Lagos Savings Circle",
  description:
    "A cooperative savings group for small business owners in Lagos, focused on rotating credit and mutual financial support.",
  admin: "GCKFBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V5",
  members: [
    {
      address: "GCKFBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V5",
      displayName: "Chidi Okafor",
      totalContributed: 2500,
      joinedAt: "2024-01-15",
      isActive: true,
      loanBalance: 500,
    },
    {
      address: "GAIAHBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V6",
      displayName: "Fatima Bello",
      totalContributed: 3200,
      joinedAt: "2024-02-10",
      isActive: true,
      loanBalance: 0,
    },
    {
      address: "GBJBHBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V7",
      displayName: "Emeka Eze",
      totalContributed: 1800,
      joinedAt: "2024-03-05",
      isActive: true,
      loanBalance: 1200,
    },
    {
      address: "GCKCIBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V8",
      displayName: "Ngozi Adichie",
      totalContributed: 4100,
      joinedAt: "2024-01-20",
      isActive: true,
      loanBalance: 0,
    },
    {
      address: "GCLDJBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V9",
      displayName: "Amina Yusuf",
      totalContributed: 900,
      joinedAt: "2024-06-12",
      isActive: false,
      loanBalance: 0,
    },
  ],
  totalContributions: 12500,
  balance: 15000,
  isActive: true,
  createdAt: "2024-01-10",
  rules: {
    minContribution: 100,
    contributionPeriodDays: 30,
    maxLoanMultiplier: 3,
    loanInterestBps: 500,
    votingQuorum: 3,
    votingPeriodDays: 7,
    latePenaltyBps: 200,
  },
  contractAddresses: {
    treasury: "GCTREASURY1...",
    loan: "GCLOAN1...",
    voting: "GCVOTING1...",
    governance: "GCGOV1...",
    dividend: "GCDIV1...",
  },
};

const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: "c1",
    member: "GCKFBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V5",
    amount: 500,
    period: 1,
    timestamp: "2024-06-01T10:30:00Z",
    txHash: "abc123def456...",
  },
  {
    id: "c2",
    member: "GAIAHBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V6",
    amount: 500,
    period: 1,
    timestamp: "2024-06-01T11:15:00Z",
    txHash: "def456ghi789...",
  },
  {
    id: "c3",
    member: "GBJBHBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V7",
    amount: 300,
    period: 1,
    timestamp: "2024-06-02T09:00:00Z",
    txHash: "ghi789jkl012...",
  },
  {
    id: "c4",
    member: "GCKCIBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V8",
    amount: 500,
    period: 1,
    timestamp: "2024-06-03T14:20:00Z",
    txHash: "jkl012mno345...",
  },
];

const MOCK_LOANS: Loan[] = [
  {
    id: 1,
    borrower: "GCKFBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V5",
    amount: 1500,
    interestBps: 500,
    repaymentDue: "2024-09-01",
    amountRepaid: 1000,
    status: "Approved",
    purpose: "Expand market stall inventory",
    requestedAt: "2024-06-01",
    approvedAt: "2024-06-05",
  },
  {
    id: 2,
    borrower: "GBJBHBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V7",
    amount: 3600,
    interestBps: 500,
    repaymentDue: "2024-12-01",
    amountRepaid: 0,
    status: "Pending",
    purpose: "Purchase delivery motorcycle",
    requestedAt: "2024-06-20",
  },
  {
    id: 3,
    borrower: "GAIAHBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V6",
    amount: 2000,
    interestBps: 500,
    repaymentDue: "2024-04-01",
    amountRepaid: 2000,
    status: "Repaid",
    purpose: "School fees for children",
    requestedAt: "2024-01-15",
    approvedAt: "2024-01-20",
  },
];

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 1,
    proposer: "GCKFBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V5",
    type: "LoanApproval",
    title: "Approve Emeka's Motorcycle Loan",
    description:
      "Vote to approve a loan of 3,600 USDC for Emeka Eze to purchase a delivery motorcycle for his logistics business.",
    votesFor: 3,
    votesAgainst: 0,
    quorum: 3,
    deadline: "2024-06-27",
    status: "Active",
    createdAt: "2024-06-20",
  },
  {
    id: 2,
    proposer: "GCKCIBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V8",
    type: "UpdateRule",
    title: "Increase Contribution Period to 45 Days",
    description:
      "Proposal to extend the contribution period from 30 to 45 days to give members more flexibility.",
    votesFor: 2,
    votesAgainst: 1,
    quorum: 3,
    deadline: "2024-07-01",
    status: "Active",
    createdAt: "2024-06-15",
  },
  {
    id: 3,
    proposer: "GAIAHBEIYTXRLJ7CF6KJH5QYD6S5YQZ2JZ2KZ3K4L5M6N7O8P9Q0R1S2T3U4V6",
    type: "TreasurySpend",
    title: "Fund Community Workshop",
    description:
      "Allocate 500 USDC from treasury for a financial literacy workshop for members.",
    votesFor: 4,
    votesAgainst: 0,
    quorum: 3,
    deadline: "2024-06-10",
    status: "Passed",
    createdAt: "2024-06-01",
  },
];

// ─── Tab Type ─────────────────────────────────────────────────────────────────

type TabKey = "members" | "contributions" | "loans" | "governance";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "members", label: "Members", icon: Users },
  { key: "contributions", label: "Contributions", icon: HandCoins },
  { key: "loans", label: "Loans", icon: CreditCard },
  { key: "governance", label: "Governance", icon: Shield },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TabKey>("members");

  // In a real app, this would come from an API call with error handling
  const group = MOCK_GROUP;
  const contributions = MOCK_CONTRIBUTIONS;
  const loans = MOCK_LOANS;
  const proposals = MOCK_PROPOSALS;

  // Handle 404 if group not found
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="w-16 h-16 text-amber-400" />
        <h1 className="text-2xl font-bold text-gray-900">Group Not Found</h1>
        <p className="text-gray-500">
          The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link
          href="/groups"
          className="flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Link>
      </div>
    );
  }

  const activeMembers = group.members.filter((m) => m.isActive);
  const totalLoansActive = loans.filter(
    (l) => l.status === "Approved" || l.status === "Pending"
  ).length;

  // Compute contribution totals per member for the contributions tab
  const memberContributions = contributions.reduce(
    (acc, c) => {
      acc[c.member] = (acc[c.member] || 0) + c.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* ── Back Link ────────────────────────────────────────────────────── */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        All Groups
      </Link>

      {/* ── Header Card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  group.isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {group.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-600 max-w-2xl">{group.description}</p>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-gray-500 shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span>
                Admin:{" "}
                <span className="font-mono text-gray-700">
                  {shortenAddress(group.admin, 6)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Treasury Balance"
          value={`$${formatAmount(group.balance)}`}
          icon={DollarSign}
          color="green"
          subtitle="USDC"
        />
        <StatCard
          title="Active Members"
          value={activeMembers.length}
          icon={Users}
          color="blue"
          subtitle={`${group.members.length} total`}
        />
        <StatCard
          title="Active Loans"
          value={totalLoansActive}
          icon={CreditCard}
          color="amber"
          subtitle={`${loans.length} total`}
        />
        <StatCard
          title="Contributions"
          value={`$${formatAmount(group.totalContributions)}`}
          icon={HandCoins}
          color="green"
          subtitle="All time"
        />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* ── Members Tab ──────────────────────────────────────────────── */}
          {activeTab === "members" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Members</h2>
                <span className="text-sm text-gray-500">
                  {activeMembers.length} active of {group.members.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-3 font-medium">Member</th>
                      <th className="pb-3 font-medium">Contributed</th>
                      <th className="pb-3 font-medium hidden sm:table-cell">Loan Balance</th>
                      <th className="pb-3 font-medium hidden md:table-cell">Joined</th>
                      <th className="pb-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.members.map((member) => (
                      <tr key={member.address} className="hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-brand-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.displayName || "Anonymous"}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">
                                {shortenAddress(member.address)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-medium text-gray-900">
                          ${formatAmount(member.totalContributed)}
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          <span
                            className={
                              member.loanBalance > 0
                                ? "text-amber-600 font-medium"
                                : "text-gray-400"
                            }
                          >
                            {member.loanBalance > 0
                              ? `$${formatAmount(member.loanBalance)}`
                              : "—"}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 hidden md:table-cell">
                          {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              member.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Contributions Tab ────────────────────────────────────────── */}
          {activeTab === "contributions" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Contributions</h2>
                <span className="text-sm text-gray-500">
                  {contributions.length} payments this period
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-3 font-medium">Member</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium hidden sm:table-cell">Period</th>
                      <th className="pb-3 font-medium hidden md:table-cell">Date</th>
                      <th className="pb-3 font-medium text-right hidden lg:table-cell">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contributions.map((c) => {
                      const member = group.members.find(
                        (m) => m.address === c.member
                      );
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                                <HandCoins className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member?.displayName || "Anonymous"}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">
                                  {shortenAddress(c.member)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-medium text-green-600">
                            +${formatAmount(c.amount)}
                          </td>
                          <td className="py-3 text-gray-500 hidden sm:table-cell">
                            Period {c.period}
                          </td>
                          <td className="py-3 text-gray-500 hidden md:table-cell">
                            {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                          </td>
                          <td className="py-3 text-right hidden lg:table-cell">
                            <span className="text-xs text-gray-400 font-mono">
                              {shortenAddress(c.txHash, 8)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Contributions by Member
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.members
                    .filter((m) => memberContributions[m.address])
                    .map((member) => (
                      <div
                        key={member.address}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-50 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-brand-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {member.displayName || "Anonymous"}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          ${formatAmount(memberContributions[member.address] || 0)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Loans Tab ────────────────────────────────────────────────── */}
          {activeTab === "loans" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Loans</h2>
                <span className="text-sm text-gray-500">
                  {loans.length} total ·{" "}
                  {loans.filter((l) => l.status === "Approved").length} active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
              {loans.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No loans in this group yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Governance Tab ───────────────────────────────────────────── */}
          {activeTab === "governance" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Governance</h2>
                <span className="text-sm text-gray-500">
                  {proposals.length} proposals ·{" "}
                  {proposals.filter((p) => p.status === "Active").length} active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
              {proposals.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No proposals yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Rules Section ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Min Contribution
            </p>
            <p className="text-lg font-semibold text-gray-900">
              ${formatAmount(group.rules.minContribution)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Contribution Period
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {group.rules.contributionPeriodDays} days
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Max Loan Multiplier
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {group.rules.maxLoanMultiplier}×
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Loan Interest
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {group.rules.loanInterestBps / 100}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Voting Quorum
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {group.rules.votingQuorum} members
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Voting Period
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {group.rules.votingPeriodDays} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
