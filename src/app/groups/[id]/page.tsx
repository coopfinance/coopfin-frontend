"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  Users, DollarSign, CreditCard, TrendingUp, Copy, Check,
  ArrowLeft, UserPlus, ExternalLink, AlertCircle, Hash
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LoanCard } from "@/components/loans/loan-card";
import { ProposalCard } from "@/components/governance/proposal-card";
import { formatAmount, shortenAddress } from "@/lib/stellar";
import { useWallet } from "@/hooks/use-wallet";
import type { Group, Member, Contribution, Loan, Proposal } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL;

async function fetchGroup(id: string): Promise<Group> {
  const res = await fetch(`${API}/api/groups/${id}`);
  if (!res.ok) throw new Error("Group not found");
  return res.json();
}

async function fetchMembers(id: string): Promise<Member[]> {
  const res = await fetch(`${API}/api/groups/${id}/members`);
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
}

async function fetchContributions(id: string): Promise<Contribution[]> {
  const res = await fetch(`${API}/api/groups/${id}/contributions`);
  if (!res.ok) throw new Error("Failed to fetch contributions");
  return res.json();
}

async function fetchGroupLoans(id: string): Promise<Loan[]> {
  const res = await fetch(`${API}/api/groups/${id}/loans`);
  if (!res.ok) throw new Error("Failed to fetch loans");
  return res.json();
}

async function fetchGroupProposals(id: string): Promise<Proposal[]> {
  const res = await fetch(`${API}/api/groups/${id}/proposals`);
  if (!res.ok) throw new Error("Failed to fetch proposals");
  return res.json();
}

async function fetchLiveBalance(id: string): Promise<number> {
  const res = await fetch(`${API}/api/groups/${id}/balance`);
  if (!res.ok) throw new Error("Failed to fetch live balance");
  const data = await res.json();
  return data.balance;
}

const TABS = [
  { key: "members", label: "Members" },
  { key: "contributions", label: "Contributions" },
  { key: "loans", label: "Loans" },
  { key: "governance", label: "Governance" },
] as const;

function MembersTable({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
        <Users className="w-8 h-8" />
        <p>No members yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Display Name</th>
            <th className="px-4 py-3 text-right">Total Contributed</th>
            <th className="px-4 py-3 text-right">Join Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {members.map((m) => (
            <tr key={m.address} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">
                {shortenAddress(m.address)}
              </td>
              <td className="px-4 py-3 text-gray-900">
                {m.displayName || "—"}
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                ${formatAmount(m.totalContributed)}
              </td>
              <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                {format(new Date(m.joinedAt), "MMM d, yyyy")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContributionsTable({ contributions }: { contributions: Contribution[] }) {
  if (contributions.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
        <DollarSign className="w-8 h-8" />
        <p>No contributions yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-right">Period</th>
            <th className="px-4 py-3 text-right">Tx Hash</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contributions.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">
                {shortenAddress(c.member)}
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                ${formatAmount(c.amount)}
              </td>
              <td className="px-4 py-3 text-right text-gray-500">
                {c.period}
              </td>
              <td className="px-4 py-3 text-right">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${c.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-brand-600 hover:text-brand-700"
                >
                  {shortenAddress(c.txHash, 6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<string>("members");
  const [copied, setCopied] = useState(false);

  const { data: group, isLoading: groupLoading, error: groupError } = useQuery({
    queryKey: ["group", id],
    queryFn: () => fetchGroup(id),
    enabled: !!id,
  });

  const { data: liveBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["live-balance", id],
    queryFn: () => fetchLiveBalance(id),
    refetchInterval: 15_000,
    enabled: !!id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["group-members", id],
    queryFn: () => fetchMembers(id),
    enabled: !!id,
  });

  const { data: contributions = [] } = useQuery({
    queryKey: ["group-contributions", id],
    queryFn: () => fetchContributions(id),
    enabled: !!id,
  });

  const { data: loans = [] } = useQuery({
    queryKey: ["group-loans", id],
    queryFn: () => fetchGroupLoans(id),
    enabled: !!id,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["group-proposals", id],
    queryFn: () => fetchGroupProposals(id),
    enabled: !!id,
  });

  const isAdmin = address === group?.admin;

  const handleCopy = useCallback(() => {
    if (!group) return;
    navigator.clipboard.writeText(group.admin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [group]);

  if (groupLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
        <div className="h-36 bg-gray-100 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-8 w-80 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="space-y-6">
        <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Link>
        <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
          <AlertCircle className="w-12 h-12" />
          <p className="text-lg font-medium">Group not found</p>
          <p className="text-sm">The group you are looking for does not exist or has been removed.</p>
          <Link href="/groups" className="text-sm text-brand-600 font-medium hover:text-brand-700 mt-2">
            Browse all groups
          </Link>
        </div>
      </div>
    );
  }

  const displayBalance = liveBalance ?? group.balance;

  return (
    <div className="space-y-6">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                group.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {group.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{group.description}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-mono text-xs">{shortenAddress(group.admin)}</span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {isAdmin && (
            <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium whitespace-nowrap">
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Treasury Balance"
          value={balanceLoading ? "..." : `$${formatAmount(displayBalance)}`}
          icon={DollarSign}
          color="green"
          subtitle={balanceLoading ? "Loading..." : "Live from Stellar"}
        />
        <StatCard
          title="Total Members"
          value={members.length}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Loans"
          value={loans.filter((l) => l.status === "Approved").length}
          icon={CreditCard}
          color="amber"
        />
        <StatCard
          title="Total Contributions"
          value={`$${formatAmount(group.totalContributions)}`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "members" && <MembersTable members={members} />}
        {activeTab === "contributions" && <ContributionsTable contributions={contributions} />}
        {activeTab === "loans" && (
          <div className="space-y-3">
            {loans.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                <Hash className="w-8 h-8" />
                <p>No loans found for this group.</p>
              </div>
            ) : (
              loans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
            )}
          </div>
        )}
        {activeTab === "governance" && (
          <div className="space-y-3">
            {proposals.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
                <TrendingUp className="w-8 h-8" />
                <p>No proposals found for this group.</p>
              </div>
            ) : (
              proposals.map((p) => <ProposalCard key={p.id} proposal={p} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
