import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useWallet } from "@solana/wallet-adapter-react";

type Activity = {
  type: "contribution" | "loan" | "vote" | "distribution";
  actor: string;
  amount: string;
  timestamp: number;
  note?: string;
};

const ICONS: Record<Activity["type"], string> = {
  contribution: "\u{1F4B0}",
  loan: "\u{1F3E7}",
  vote: "\u{1F5F3}",
  distribution: "\u{1F4E4}",
};

async function fetchActivity(wallet: string) {
  const res = await fetch(`/api/notifications?recipient=${wallet}`);
  if (!res.ok) throw new Error("Failed to load activity");
  return (await res.json()) as Activity[];
}

export function RecentActivity() {
  const { connected, publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["activity", wallet],
    queryFn: () => fetchActivity(wallet),
    enabled: connected,
  });

  if (!connected) return <div className="recent-activity">Connect wallet to see activity.</div>;
  if (isLoading) return <div className="recent-activity">Loading…</div>;

  return (
    <div className="recent-activity">
      {data?.map((a, i) => (
        <div key={i} className="activity-item">
          <span className="activity-icon">{ICONS[a.type]}</span>
          <span className="activity-actor">{a.actor}</span>
          <span className="activity-note">{a.note ?? a.type}</span>
          <span className="activity-time">{formatDistanceToNow(a.timestamp * 1000, { addSuffix: true })}</span>
        </div>
      ))}
    </div>
  );
}
