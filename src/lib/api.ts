import type { Group } from "@/types";

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

export async function createGroup(
  payload: CreateGroupPayload
): Promise<Group> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/groups`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to create group (${res.status}): ${text}`);
  }

  return res.json();
}
