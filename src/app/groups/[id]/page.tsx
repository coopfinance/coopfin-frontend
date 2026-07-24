"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, notFound } from "next/navigation";
import {
  Copy,
  Check,
  Users,
  CreditCard,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  UserPlus,
  Landmark,
  FileText,
  Vote,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LoanCard } from "@/components/loans/loan-card";
import { ProposalCard } from "@/components/governance/proposal-card";
import { shortenAddress, formatAmount } from "@/lib/stellar";
import {
  fetchGroup,
  fetchGroupMembers,
  fetchGroupContributions,
  fetchGroupLoans,
  fetchGroupProposals,
} from "@/lib/api";
import { useWallet } from "@/hooks/use-wallet";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

// ─── Stellar chain balance ────────────────────────────────────────────────

/** Query the on-chain USDC balance of a contract address via Horizon. */
async function fetchChainBalance(
  contractAddress: string
): Promise<string | null> {
  if (!contractAddress) return null;
  try {
    const horizon =
      process.env.NEXT_PUBLIC_HORIZON_URL ||
      "https://horizon-testnet.stellar.org";
    const res = await fetch(
      `${horizon}/accounts/${encodeURIComponent(contractAddress)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const bal of data.balances || []) {
      if (
        bal.asset_type === "credit_alphanum4" &&
        bal.asset_code === "USDC"
      ) {
        return bal.balance;
      }
      // Also try native XLM as a last resort (should never happen for a treasury)
    }
    // If the contract address holds no USDC yet, return "0"
    return "0";
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-1"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

const TABS = [
  { key: "members", label: "Members", icon: Users },
  { key: "contributions", label: "Contributions", icon: TrendingUp },
  { key: "loans", label: "Loans", icon: CreditCard },
  { key: "governance", label: "Governance", icon: Vote },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { address } = useWallet();

  const [activeTab, setActiveTab] = useState<string>("members");

  // ── Group ────────────────────────────────────────────────────────────
  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
  } = useQuery({
    queryKey: ["group", id],
    queryFn: () => fetchGroup(id),
    enabled: !!id,
  });

  // ── Chain balance ────────────────────────────────────────────────────
  const { data: chainBalance } = useQuery({
    queryKey: ["chain-balance", group?.contractAddresses?.treasury],
    queryFn: () =>
      fetchChainBalance(group?.contractAddresses?.treasury ?? ""),
    enabled: !!group?.contractAddresses?.treasury,
    refetchInterval: 30_000,
  });

  // ── Members ──────────────────────────────────────────────────────────
  const { data: members = [] } = useQuery({
    queryKey: ["group-members", id],
    queryFn: () => fetchGroupMembers(id),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  // ── Contributions ────────────────────────────────────────────────────
  const { data: contributions = [], isLoading: contribsLoading } = useQuery({
    queryKey: ["group-contributions", id],
    queryFn: () => fetchGroupContributions(id),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  // ── Loans ────────────────────────────────────────────────────────────
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ["group-loans", id],
    queryFn: () => fetchGroupLoans(id),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  // ── Proposals ────────────────────────────────────────────────────────
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ["group-proposals", id],
    queryFn: () => fetchGroupProposals(id),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  // ── Derived ──────────────────────────────────────────────────────────
  const isAdmin = !!address && !!group && address === group.admin;
  const memberCount = members.length || group?.members?.length || 0;
  const activeLoans = loans.filter((l) => l.status === "Approved").length;
  const totalContributions =
    contributions.reduce((sum, c) => sum + c.amount, 0) ||
    group?.totalContributions ||
    0;
  const displayBalance = chainBalance ?? group?.balance ?? 0;

  // ── Error / Loading ──────────────────────────────────────────────────
  if (groupError) {
    if ((groupError as Error).message === "NOT_FOUND") {
      notFound();
    }
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-3">
        <AlertCircle className="w-10 h-10" />
        <p className="text-lg font-medium">Failed to load group</p>
        <p className="text-sm">{(groupError as Error).message}</p>
      </div>
    );
  }

  if (groupLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-96 bg-gray-100 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!group) return null;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
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
          {group.description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span className="text-xs text-gray-400">
              Admin: {shortenAddress(group.admin)}
            </span>
            <CopyButton text={group.admin} />
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Chain Balance"
          value={`$${formatAmount(Number(displayBalance))} USDC`}
          icon={Landmark}
          color="green"
          subtitle={chainBalance ? "Live · Stellar RPC" : "From API"}
        />
        <StatCard
          title="Members"
          value={memberCount}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Loans"
          value={activeLoans}
          icon={CreditCard}
          color="amber"
        />
        <StatCard
          title="Total Contributions"
          value={`$${formatAmount(totalContributions)}`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-shrink-0",
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Members ─────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Contributed
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-16 text-center text-gray-400"
                    >
                      No members yet.
                    </td>
                  </tr>
                ) : (
                  members.map((m, i) => (
                    <tr key={m.address ?? i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        <span className="hidden sm:inline">
                          {m.address}
                        </span>
                        <span className="sm:hidden">
                          {shortenAddress(m.address)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {m.displayName || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ${formatAmount(m.totalContributed)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400 hidden md:table-cell">
                        {m.joinedAt
                          ? formatDistanceToNow(new Date(m.joinedAt), {
                              addSuffix: true,
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Contributions ────────────────────────────────────────── */}
      {activeTab === "contributions" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {contribsLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-100 animate-pulse rounded"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Period
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Tx Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contributions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-16 text-center text-gray-400"
                      >
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No contributions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    contributions.map((c, i) => (
                      <tr key={c.id ?? i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          <span className="hidden sm:inline">
                            {c.member}
                          </span>
                          <span className="sm:hidden">
                            {shortenAddress(c.member)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ${formatAmount(c.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500 hidden sm:table-cell">
                          #{c.period}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          {c.txHash ? (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${c.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-mono"
                            >
                              {shortenAddress(c.txHash, 3)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Loans ────────────────────────────────────────────────── */}
      {activeTab === "loans" && (
        <div>
          {loansLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-100 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
              <CreditCard className="w-8 h-8" />
              <p>No loans for this group yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Governance ───────────────────────────────────────────── */}
      {activeTab === "governance" && (
        <div>
          {proposalsLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 bg-gray-100 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
              <FileText className="w-8 h-8" />
              <p>No governance proposals for this group yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
