import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Users, DollarSign, Settings, HandCoins } from "lucide-react";
import Link from "next/link";
import { formatAmount, shortenAddress } from "@/lib/stellar";
import { ContributeModal } from "@/components/groups/contribute-modal";
import type { Group } from "@/types";

async function fetchGroup(id: string): Promise<Group> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}`);
  if (!res.ok) throw new Error("Failed to fetch group");
  return res.json();
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [showContribute, setShowContribute] = useState(false);

  const { data: group, isLoading, error } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/groups"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Failed to load group details.</p>
        </div>
      ) : group ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{group.description}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                group.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {group.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500">
                <DollarSign className="h-4 w-4" />
                Treasury Balance
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(group.balance)} USDC
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500">
                <Users className="h-4 w-4" />
                Members
              </div>
              <p className="text-2xl font-bold text-gray-900">{group.members.length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Settings className="h-4 w-4" />
              Group Rules
            </div>
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <dt className="text-xs text-gray-500">Min Contribution</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatAmount(group.rules.minContribution)} USDC
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Contribution Period</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {group.rules.contributionPeriodDays} days
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Max Loan Multiplier</dt>
                <dd className="text-sm font-medium text-gray-900">{group.rules.maxLoanMultiplier}x</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Loan Interest</dt>
                <dd className="text-sm font-medium text-gray-900">{group.rules.loanInterestBps / 100}%</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Voting Quorum</dt>
                <dd className="text-sm font-medium text-gray-900">{group.rules.votingQuorum}%</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Voting Period</dt>
                <dd className="text-sm font-medium text-gray-900">{group.rules.votingPeriodDays} days</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users className="h-4 w-4" />
              Members
            </div>
            <div className="space-y-2">
              {group.members.map((member) => (
                <div
                  key={member.address}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.displayName || shortenAddress(member.address)}
                    </p>
                    <p className="text-xs text-gray-500">{shortenAddress(member.address)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatAmount(member.totalContributed)} USDC
                    </p>
                    <p className="text-xs text-gray-500">contributed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowContribute(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <HandCoins className="h-4 w-4" />
              Make a Contribution
            </button>
          </div>

          {showContribute && group && (
            <ContributeModal group={group} onClose={() => setShowContribute(false)} />
          )}
        </>
      ) : null }
    </div>
  );
}
