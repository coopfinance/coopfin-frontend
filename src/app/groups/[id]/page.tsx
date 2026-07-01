"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Loader2,
  HandCoins,
} from "lucide-react";
import Link from "next/link";
import { formatAmount, shortenAddress } from "@/lib/stellar";
import { ContributeModal } from "@/components/groups/contribute-modal";
import type { Group } from "@/types";

async function fetchGroup(id: string): Promise<Group> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}`
  );
  if (!res.ok) throw new Error("Failed to fetch group");
  return res.json();
}

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showContribute, setShowContribute] = useState(false);

  const { data: group, isLoading, error } = useQuery({
    queryKey: ["group", id],
    queryFn: () => fetchGroup(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/groups" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-8 w-48 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/groups" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Group Not Found</h1>
        </div>
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Could not load group details.</p>
          <p className="text-sm mt-1">The group may not exist or the server may be unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/groups" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500">{group.description}</p>
          </div>
        </div>
        <button
          onClick={() => setShowContribute(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <HandCoins className="w-4 h-4" />
          Contribute
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50">
              <DollarSign className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Treasury Balance</p>
              <p className="text-xl font-bold text-gray-900">
                ${formatAmount(group.balance)} USDC
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-stellar-50">
              <Users className="w-5 h-5 text-stellar-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Members</p>
              <p className="text-xl font-bold text-gray-900">
                {group.members.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Contributions</p>
              <p className="text-xl font-bold text-gray-900">
                ${formatAmount(group.totalContributions)} USDC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Group Rules */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Group Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Min Contribution</p>
              <p className="text-sm font-medium text-gray-900">
                ${formatAmount(group.rules.minContribution)} USDC
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Contribution Period</p>
              <p className="text-sm font-medium text-gray-900">
                {group.rules.contributionPeriodDays} days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Max Loan Multiplier</p>
              <p className="text-sm font-medium text-gray-900">
                {group.rules.maxLoanMultiplier}x contributions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Members ({group.members.length})
        </h2>
        <div className="divide-y divide-gray-100">
          {group.members.map((member) => (
            <div
              key={member.address}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.displayName || shortenAddress(member.address)}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {shortenAddress(member.address, 6)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ${formatAmount(member.totalContributed)}
                </p>
                <p className="text-xs text-gray-500">contributed</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Admin</h2>
        <p className="text-sm font-mono text-gray-600">
          {group.admin}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Created: {new Date(group.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Contribute Modal */}
      {showContribute && (
        <ContributeModal
          group={group}
          onClose={() => setShowContribute(false)}
        />
      )}
    </div>
  );
}
