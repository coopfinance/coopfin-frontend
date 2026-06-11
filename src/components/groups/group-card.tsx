"use client";

import Link from "next/link";
import { Users, DollarSign, ArrowRight } from "lucide-react";
import { formatAmount, shortenAddress } from "@/lib/stellar";
import type { Group } from "@/types";

export function GroupCard({ group }: { group: Group }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{group.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Admin: {shortenAddress(group.admin)}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          group.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {group.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{group.members.length} members</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">${formatAmount(group.balance)} USDC</span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <Link
          href={`/groups/${group.id}`}
          className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700"
        >
          View Group <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
