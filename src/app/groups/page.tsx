"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { GroupCard } from "@/components/groups/group-card";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import type { Group } from "@/types";

async function fetchGroups(): Promise<Group[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

export default function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-sm text-gray-500">Manage your cooperatives and savings groups</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No groups yet.</p>
          <p className="text-sm">Create your first cooperative or savings group.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => <GroupCard key={g.id} group={g} />)}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
