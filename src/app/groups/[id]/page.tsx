"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Copy, DollarSign, Landmark, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { formatAmount, shortenAddress } from "@/lib/stellar";
import type { Group, Member } from "@/types";

async function fetchGroup(id: string): Promise<Group> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const detail = await fetch(`${baseUrl}/api/groups/${encodeURIComponent(id)}`);

  if (detail.ok) {
    return detail.json();
  }

  const list = await fetch(`${baseUrl}/api/groups`);
  if (!list.ok) {
    throw new Error("Failed to fetch group");
  }

  const groups = (await list.json()) as Group[];
  const group = groups.find((item) => item.id === id);

  if (!group) {
    throw new Error("Group not found");
  }

  return group;
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function AddressRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <code className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">
        {shortenAddress(value, 6)}
      </code>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {member.displayName || shortenAddress(member.address)}
        </p>
        <p className="text-xs text-gray-400">{shortenAddress(member.address, 6)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          ${formatAmount(member.totalContributed)} USDC
        </p>
        <p className="text-xs text-gray-400">
          {member.isActive ? "Active member" : "Inactive member"}
        </p>
      </div>
    </div>
  );
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const { data: group, isLoading, error } = useQuery({
    queryKey: ["group", params.id],
    queryFn: () => fetchGroup(params.id),
  });

  const activeMembers = useMemo(
    () => group?.members.filter((member) => member.isActive).length ?? 0,
    [group]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-36 animate-pulse rounded bg-gray-100" />
        <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-6">
        <Link href="/groups" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </Link>
        <div className="rounded-xl border border-red-100 bg-red-50 p-6">
          <p className="font-semibold text-red-900">Group unavailable</p>
          <p className="mt-1 text-sm text-red-700">
            {error instanceof Error ? error.message : "Unable to load this group."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/groups" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Back to groups
      </Link>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {group.isActive ? "Active group" : "Inactive group"}
              </span>
              <span className="text-xs text-gray-400">
                Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{group.description}</p>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(group.id)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            Copy ID
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatTile icon={Users} label="Members" value={`${activeMembers}/${group.members.length}`} />
        <StatTile icon={DollarSign} label="Balance" value={`$${formatAmount(group.balance)} USDC`} />
        <StatTile icon={Landmark} label="Total contributed" value={`$${formatAmount(group.totalContributions)} USDC`} />
        <StatTile icon={CalendarDays} label="Period" value={`${group.rules.contributionPeriodDays} days`} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900">Members</h2>
          <div className="mt-3">
            {group.members.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No members yet.</p>
            ) : (
              group.members.map((member) => <MemberRow key={member.address} member={member} />)
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">Cooperative Rules</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Minimum contribution</span>
                <span className="font-medium text-gray-900">${formatAmount(group.rules.minContribution)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max loan multiplier</span>
                <span className="font-medium text-gray-900">{group.rules.maxLoanMultiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loan interest</span>
                <span className="font-medium text-gray-900">{group.rules.loanInterestBps / 100}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Voting quorum</span>
                <span className="font-medium text-gray-900">{group.rules.votingQuorum}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">Contracts</h2>
            <div className="mt-2">
              <AddressRow label="Treasury" value={group.contractAddresses.treasury} />
              <AddressRow label="Loan" value={group.contractAddresses.loan} />
              <AddressRow label="Voting" value={group.contractAddresses.voting} />
              <AddressRow label="Governance" value={group.contractAddresses.governance} />
              <AddressRow label="Dividend" value={group.contractAddresses.dividend} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
