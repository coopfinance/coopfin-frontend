"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, DollarSign, Calendar, Copy, Check } from "lucide-react";
import Link from "next/link";

interface GroupDetail {
  id: string;
  name: string;
  description: string;
  admin: string;
  balance: number;
  minContribution: number;
  cycleDuration: number;
  isActive: boolean;
  members: string[];
  createdAt: string;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchGroup() {
      try {
        setLoading(true);
        const res = await fetch(`/api/groups/${id}`);
        if (res.ok) {
          const data = await res.json();
          setGroup(data);
        } else {
          // Mock data
          setGroup({
            id,
            name: "Savings Circle Alpha",
            description: "A community savings group for monthly contributions and micro-loans.",
            admin: "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
            balance: 5400,
            minContribution: 50,
            cycleDuration: 30,
            isActive: true,
            members: [
              "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
              "GBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA76",
              "GCYP7B4NIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7K",
            ],
            createdAt: "2026-06-15T10:00:00Z",
          });
        }
      } catch {
        setGroup({
          id,
          name: "Savings Circle Alpha",
          description: "A community savings group for monthly contributions and micro-loans.",
          admin: "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
          balance: 5400,
          minContribution: 50,
          cycleDuration: 30,
          isActive: true,
          members: [
            "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
            "GBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA76",
          ],
          createdAt: "2026-06-15T10:00:00Z",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, [id]);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="max-w-4xl mx-auto"><Skeleton /></div>;
  if (!group) return <div className="max-w-4xl mx-auto text-center py-12 text-gray-500">Group not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/groups" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500">{group.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Balance</span>
          </div>
          <p className="text-xl font-bold text-gray-900">${group.balance.toLocaleString()} USDC</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Members</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{group.members.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Min Contribution</span>
          </div>
          <p className="text-xl font-bold text-gray-900">${group.minContribution} USDC</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Cycle</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{group.cycleDuration} days</p>
        </div>
      </div>

      {/* Admin & Contract */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Contract Details</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Admin</span>
            <button
              onClick={() => copyAddress(group.admin)}
              className="flex items-center gap-1.5 text-sm font-mono text-gray-700 hover:text-indigo-600"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {group.admin.slice(0, 8)}...{group.admin.slice(-4)}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              group.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {group.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Created</span>
            <span className="text-sm text-gray-700">{new Date(group.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Members ({group.members.length})</h2>
        <div className="space-y-2">
          {group.members.map((member, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm font-mono text-gray-700">
                {member.slice(0, 8)}...{member.slice(-4)}
              </span>
              {member === group.admin && (
                <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">Admin</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
