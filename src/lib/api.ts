import type { Group, Member, Contribution, Loan, Proposal } from "@/types";

export interface CreateGroupPayload {
  name: string;
  description: string;
  admin: string;
  minContribution: number;
  contributionPeriodDays: number;
  contractAddresses: {
    treasury: string;
    loan: string;
    voting: string;
  };
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

export async function createGroup(
  payload: CreateGroupPayload
): Promise<Group> {
  const res = await fetch(`${API}/api/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to create group (${res.status}): ${text}`);
  }

  return res.json();
}

/** Fetch a single group by ID from the backend API. */
export async function fetchGroup(id: string): Promise<Group> {
  const res = await fetch(`${API}/api/groups/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error(`Failed to fetch group (${res.status})`);
  }
  return res.json();
}

/** Fetch members of a group. */
export async function fetchGroupMembers(id: string): Promise<Member[]> {
  const res = await fetch(
    `${API}/api/groups/${encodeURIComponent(id)}/members`
  );
  if (!res.ok) return [];
  return res.json();
}

/** Fetch contribution history for a group. */
export async function fetchGroupContributions(
  id: string
): Promise<Contribution[]> {
  const res = await fetch(
    `${API}/api/groups/${encodeURIComponent(id)}/contributions`
  );
  if (!res.ok) return [];
  return res.json();
}

/** Fetch loans associated with a group. */
export async function fetchGroupLoans(id: string): Promise<Loan[]> {
  const res = await fetch(
    `${API}/api/groups/${encodeURIComponent(id)}/loans`
  );
  if (!res.ok) return [];
  return res.json();
}

/** Fetch proposals associated with a group. */
export async function fetchGroupProposals(id: string): Promise<Proposal[]> {
  const res = await fetch(
    `${API}/api/groups/${encodeURIComponent(id)}/proposals`
  );
  if (!res.ok) return [];
  return res.json();
}
