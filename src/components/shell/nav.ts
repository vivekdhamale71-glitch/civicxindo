import { Home, LayoutGrid, ListChecks, Wallet, UserRound, ClipboardCheck, ShieldCheck, ChartColumn, MessageSquare } from "lucide-react";

export const TABS = [
  { key: "home", to: "/", authTo: "/me", icon: Home, label: "nav.home", match: /^\/(me)?$/ },
  { key: "schemes", to: "/schemes", icon: LayoutGrid, label: "nav.schemes", match: /^\/(schemes|apply)/ },
  { key: "track", to: "/track", icon: ListChecks, label: "nav.track", match: /^\/(track|grievances)/ },
  { key: "wallet", to: "/wallet", icon: Wallet, label: "nav.wallet", match: /^\/wallet/ },
  { key: "profile", to: "/profile", icon: UserRound, label: "nav.profile", match: /^\/(profile|login)/ },
] as const;

export const SIDEBAR_EXTRA = [
  { to: "/eligibility", icon: ClipboardCheck, label: "nav.eligibility" },
  { to: "/grievances", icon: MessageSquare, label: "nav.grievances" },
  { to: "/verify", icon: ShieldCheck, label: "nav.verify" },
  { to: "/open-data", icon: ChartColumn, label: "nav.open_data" },
];

export const isTabRoot = (path: string) => ["/", "/me", "/schemes", "/track", "/wallet", "/profile"].includes(path);
