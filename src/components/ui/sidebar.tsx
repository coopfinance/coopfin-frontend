"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Vote, Landmark, BarChart3, Settings,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/groups",     label: "Groups",      icon: Users },
  { href: "/loans",      label: "Loans",       icon: CreditCard },
  { href: "/governance", label: "Governance",  icon: Vote },
  { href: "/treasury",   label: "Treasury",    icon: Landmark },
  { href: "/analytics",  label: "Analytics",   icon: BarChart3 },
  { href: "/settings",   label: "Settings",    icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            CF
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">CoopFinance</p>
            <p className="text-xs text-gray-400">on Stellar</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={clsx("w-4 h-4", active ? "text-brand-600" : "text-gray-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Stellar indicator */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Stellar Testnet</span>
        </div>
      </div>
    </aside>
  );
}
