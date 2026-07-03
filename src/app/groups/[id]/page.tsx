"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@radix-ui/react-tabs";
import { Copy, Plus, ExternalLink, ShieldCheck, Users, Banknote, CreditCard, Activity } from "lucide-react";
import { formatAmount, shortenAddress, server } from "@/lib/stellar";
import { LoanCard } from "@/components/loans/loan-card";
import { ProposalCard } from "@/components/governance/proposal-card";
import type { Group, Member, Contribution, Loan, Proposal } from "@/types";
import { useWallet } from "@/hooks/use-wallet";

// Mock Data
const MOCK_GROUP: Group = {
  id: "g1",
  name: "Nairobi Tech Cooperative",
  description: "A savings group for developers in Nairobi to pool funds and invest.",
  admin: "GBX73XGZ4B36O3O5G753W3U5H3P42S54F3L7YGBZ2V2XQWZ6LKT22XOY",
  members: [],
  totalContributions: 15000,
  balance: 0,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  rules: { minContribution: 100, contributionPeriodDays: 30, maxLoanMultiplier: 3, loanInterestBps: 500, votingQuorum: 50, votingPeriodDays: 7, latePenaltyBps: 100 },
  contractAddresses: {
    treasury: "CA3Z2HGB24KXXB2FUXH3P42S54F3L7YGBZ2V2XQWZ6LKT22XOYABCDEF",
    loan: "", voting: "", governance: "", dividend: ""
  }
};

const MOCK_MEMBERS: Member[] = [
  { address: "GBX73XGZ4B36O3O5G753W3U5H3P42S54F3L7YGBZ2V2XQWZ6LKT22XOY", displayName: "Alice (Admin)", totalContributed: 5000, joinedAt: "2024-01-01T00:00:00Z", isActive: true, loanBalance: 0 },
  { address: "GCTXYZABCDEF1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567", displayName: "Bob Builder", totalContributed: 4000, joinedAt: "2024-01-15T00:00:00Z", isActive: true, loanBalance: 1500 },
  { address: "GDABCD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123", displayName: "Charlie P", totalContributed: 6000, joinedAt: "2024-02-01T00:00:00Z", isActive: true, loanBalance: 0 },
];

const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: "c1", member: "GBX73XGZ4B36O3O5G753W3U5H3P42S54F3L7YGBZ2V2XQWZ6LKT22XOY", amount: 1000, period: 1, timestamp: "2024-01-10T00:00:00Z", txHash: "abc123hash" },
  { id: "c2", member: "GCTXYZABCDEF1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567", amount: 1000, period: 1, timestamp: "2024-01-11T00:00:00Z", txHash: "def456hash" },
];

const MOCK_LOANS: Loan[] = [
  { id: 1, borrower: "GCTXYZABCDEF1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567", amount: 2000, interestBps: 500, repaymentDue: "2024-12-31T00:00:00Z", amountRepaid: 500, status: "Approved", purpose: "New laptop", requestedAt: "2024-03-01T00:00:00Z", approvedAt: "2024-03-05T00:00:00Z" }
];

const MOCK_PROPOSALS: Proposal[] = [
  { id: 1, proposer: "GBX73XGZ4B36O3O5G753W3U5H3P42S54F3L7YGBZ2V2XQWZ6LKT22XOY", type: "AddMember", title: "Add Dave to Group", description: "Dave wants to join and agrees to rules", votesFor: 2, votesAgainst: 0, quorum: 2, deadline: "2024-07-01T00:00:00Z", status: "Active", createdAt: "2024-06-25T00:00:00Z" }
];

// Fetchers
async function fetchGroup(id: string): Promise<Group> {
  const url = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}` : "";
  if (!url) return Promise.resolve(MOCK_GROUP);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Not found");
    return res.json();
  } catch {
    return Promise.resolve(MOCK_GROUP);
  }
}

async function fetchMembers(id: string): Promise<Member[]> {
  return Promise.resolve(MOCK_MEMBERS);
}

async function fetchContributions(id: string): Promise<Contribution[]> {
  return Promise.resolve(MOCK_CONTRIBUTIONS);
}

async function fetchLoans(id: string): Promise<Loan[]> {
  return Promise.resolve(MOCK_LOANS);
}

async function fetchProposals(id: string): Promise<Proposal[]> {
  return Promise.resolve(MOCK_PROPOSALS);
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { address } = useWallet();
  const [liveTreasury, setLiveTreasury] = useState<number | null>(null);

  const { data: group, isLoading: groupLoading, isError } = useQuery({ queryKey: ["group", id], queryFn: () => fetchGroup(id) });
  const { data: members = [] } = useQuery({ queryKey: ["members", id], queryFn: () => fetchMembers(id) });
  const { data: contributions = [] } = useQuery({ queryKey: ["contributions", id], queryFn: () => fetchContributions(id) });
  const { data: loans = [] } = useQuery({ queryKey: ["loans", id], queryFn: () => fetchLoans(id) });
  const { data: proposals = [] } = useQuery({ queryKey: ["proposals", id], queryFn: () => fetchProposals(id) });

  useEffect(() => {
    async function fetchTreasury() {
      if (!group?.contractAddresses?.treasury) return;
      try {
        const horizonRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${group.contractAddresses.treasury}`);
        if (horizonRes.ok) {
          const data = await horizonRes.json();
          const nativeBal = data.balances?.find((b: any) => b.asset_type === "native");
          if (nativeBal) {
            setLiveTreasury(Number(nativeBal.balance));
          } else {
            setLiveTreasury(0);
          }
        } else {
          setLiveTreasury(0);
        }
      } catch (err) {
        console.error("Failed to fetch live treasury:", err);
        setLiveTreasury(0);
      }
    }
    fetchTreasury();
  }, [group?.contractAddresses?.treasury]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (groupLoading) {
    return <div className="p-10 animate-pulse text-gray-500">Loading group details...</div>;
  }

  if (isError || !group) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Group Not Found</h1>
        <p className="text-gray-500 mt-2">The group you are looking for does not exist.</p>
      </div>
    );
  }

  const isAdmin = address === group.admin;
  const activeLoansCount = loans.filter((l) => l.status === "Approved").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.isActive ? (
              <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200">Active</span>
            ) : (
              <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200">Inactive</span>
            )}
          </div>
          <p className="text-gray-600 max-w-2xl mb-4">{group.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Admin:</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">{shortenAddress(group.admin, 6)}</code>
            <button onClick={() => copyToClipboard(group.admin)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isAdmin && (
          <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Treasury Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {liveTreasury !== null ? `${liveTreasury.toLocaleString()} XLM` : "Loading..."}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Members</p>
            <p className="text-2xl font-bold text-gray-900">{members.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Loans</p>
            <p className="text-2xl font-bold text-gray-900">{activeLoansCount}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Contributions</p>
            <p className="text-2xl font-bold text-gray-900">${group.totalContributions.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs.Root defaultValue="members" className="flex flex-col">
        <Tabs.List className="flex shrink-0 border-b border-gray-200 mb-6">
          <Tabs.Trigger
            value="members"
            className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 transition-all outline-none"
          >
            Members
          </Tabs.Trigger>
          <Tabs.Trigger
            value="contributions"
            className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 transition-all outline-none"
          >
            Contributions
          </Tabs.Trigger>
          <Tabs.Trigger
            value="loans"
            className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 transition-all outline-none"
          >
            Loans
          </Tabs.Trigger>
          <Tabs.Trigger
            value="governance"
            className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600 transition-all outline-none"
          >
            Governance
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="members" className="outline-none">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Display Name</th>
                  <th className="px-6 py-4">Total Contributed</th>
                  <th className="px-6 py-4">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((m) => (
                  <tr key={m.address} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {shortenAddress(m.address, 6)}
                    </td>
                    <td className="px-6 py-4">{m.displayName || "-"}</td>
                    <td className="px-6 py-4">${m.totalContributed.toLocaleString()}</td>
                    <td className="px-6 py-4">{new Date(m.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && <div className="p-8 text-center text-gray-500">No members found.</div>}
          </div>
        </Tabs.Content>

        <Tabs.Content value="contributions" className="outline-none">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{shortenAddress(c.member, 6)}</td>
                    <td className="px-6 py-4">${c.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">#{c.period}</td>
                    <td className="px-6 py-4">{new Date(c.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${c.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline flex items-center gap-1"
                      >
                        {c.txHash.slice(0, 8)}... <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contributions.length === 0 && <div className="p-8 text-center text-gray-500">No contributions found.</div>}
          </div>
        </Tabs.Content>

        <Tabs.Content value="loans" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans.map((l) => (
              <LoanCard key={l.id} loan={l} />
            ))}
          </div>
          {loans.length === 0 && <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-xl border-dashed">No active loans found.</div>}
        </Tabs.Content>

        <Tabs.Content value="governance" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
          {proposals.length === 0 && <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-xl border-dashed">No proposals found.</div>}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
