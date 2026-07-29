'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, notFound } from 'next/navigation';
import { useState } from 'react';
import { Copy, Users, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import type { Group, Member, Contribution, Loan, Proposal } from '@/types';

async function fetchGroup(id: string): Promise<Group | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchGroupMembers(id: string): Promise<Member[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}/members`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchTreasuryBalance(group: Group): Promise<number> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/treasury`);
    if (res.ok) {
      const data = await res.json();
      return data.balance ?? group.balance;
    }
  } catch {}
  return group.balance;
}

const TABS = ['Members', 'Contributions', 'Loans', 'Governance'] as const;
type Tab = (typeof TABS)[number];

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('Members');
  const [copied, setCopied] = useState(false);

  const { data: group, isLoading, isError } = useQuery({
    queryKey: ['group', params.id],
    queryFn: () => fetchGroup(params.id),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', params.id],
    queryFn: () => fetchGroupMembers(params.id),
    enabled: !!group,
  });

  const { data: treasuryBalance } = useQuery({
    queryKey: ['treasury', params.id],
    queryFn: () => fetchTreasuryBalance(group!),
    enabled: !!group,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !group) {
    notFound();
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(group.admin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: 'Treasury', value: `$${(treasuryBalance ?? group.balance).toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Members', value: group.members?.length ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Contributions', value: `$${group.totalContributions.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Status', value: group.isActive ? 'Active' : 'Inactive', icon: CreditCard, color: group.isActive ? 'text-green-600' : 'text-red-600', bg: group.isActive ? 'bg-green-50' : 'bg-red-50' },
  ];

  const tabContent: Record<Tab, React.ReactNode> = {
    Members: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Address</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Display Name</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Contributed</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.address} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs text-gray-500">
                  {m.address.slice(0, 6)}...{m.address.slice(-4)}
                </td>
                <td className="py-3 px-4 text-gray-900">{m.displayName || '—'}</td>
                <td className="py-3 px-4 text-right text-gray-900">${m.totalContributed.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-500">{new Date(m.joinedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    Contributions: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Member</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Amount</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Period</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600">Transaction</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={4} className="py-8 text-center text-gray-400">No contributions yet</td></tr>
          </tbody>
        </table>
      </div>
    ),
    Loans: (
      <div className="py-8 text-center text-gray-400">No active loans</div>
    ),
    Governance: (
      <div className="py-8 text-center text-gray-400">No active proposals</div>
    ),
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${group.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {group.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-3">{group.description}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Admin:</span>
              <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{group.admin.slice(0, 10)}...{group.admin.slice(-6)}</code>
              <button onClick={copyAddress} className="text-brand-600 hover:text-brand-700 text-xs">
                {copied ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors">
            + Add Member
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4">{tabContent[activeTab]}</div>
      </div>
    </div>
  );
}
