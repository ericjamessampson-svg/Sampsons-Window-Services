"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useData } from "@/lib/store";
import { NumbersIcon, PlanIcon, RoadmapIcon, SettingsIcon, TodayIcon } from "./Icons";

const NAV = [
  { href: "/", label: "Today", Icon: TodayIcon },
  { href: "/roadmap", label: "Roadmap", Icon: RoadmapIcon },
  { href: "/plan", label: "Plan", Icon: PlanIcon },
  { href: "/numbers", label: "Numbers", Icon: NumbersIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

/** Page frame: bottom tabs on phones, a sidebar on computers. Sends new users to onboarding. */
export function AppShell({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const data = useData();
  const needsOnboarding = data !== null && !data.profile;

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main">
        <div className="brand">10K Homes</div>
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
      <main className={`main${narrow ? " narrow" : ""}`}>
        {data === null || needsOnboarding ? <p className="muted">Loading…</p> : children}
      </main>
      <nav className="tabbar" aria-label="Main">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
