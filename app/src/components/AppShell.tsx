"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useData } from "@/lib/store";
import { CalendarIcon, HomeIcon, NumbersIcon, PlanIcon, RoadmapIcon, SettingsIcon, ToolsIcon } from "./Icons";

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/schedule", label: "Schedule", Icon: CalendarIcon },
  { href: "/roadmap", label: "Roadmap", Icon: RoadmapIcon },
  { href: "/plan", label: "Plan", Icon: PlanIcon },
  { href: "/more", label: "Tools", Icon: ToolsIcon },
  { href: "/numbers", label: "Numbers", Icon: NumbersIcon, desktopOnly: true },
  { href: "/settings", label: "Settings", Icon: SettingsIcon, desktopOnly: true },
];

// Pages reached from the Tools tab light up that tab.
const TOOL_PAGES = ["/knock", "/goal", "/kit"];
const isCurrent = (path: string, href: string) =>
  path === href || (href === "/more" && TOOL_PAGES.some((t) => path.startsWith(t)));

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
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/spur-mark.png" alt="" width={34} height={29} />
          Spur
        </div>
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={isCurrent(path, href) ? "page" : undefined}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
      <main className={`main${narrow ? " narrow" : ""}`}>
        {data === null || needsOnboarding ? <p className="muted">Loading…</p> : children}
      </main>
      <nav className="tabbar" aria-label="Main">
        {NAV.filter((n) => !n.desktopOnly).map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={isCurrent(path, href) ? "page" : undefined}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
