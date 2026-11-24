import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import HomePage from "@/routes/Home";

type Loader = () => Promise<{ default: ComponentType }>;

export const loaders = {
  Home: () => Promise.resolve({ default: HomePage }),
  Eligibility: () => import("@/routes/Eligibility"),
  Schemes: () => import("@/routes/Schemes"),
  SchemeDetail: () => import("@/routes/SchemeDetail"),
  Verify: () => import("@/routes/Verify"),
  OpenData: () => import("@/routes/OpenData"),
  InfoPage: () => import("@/routes/InfoPage"),
  Login: () => import("@/routes/Login"),
  Dashboard: () => import("@/routes/Dashboard"),
  Apply: () => import("@/routes/Apply"),
  Track: () => import("@/routes/Track"),
  TrackDetail: () => import("@/routes/TrackDetail"),
  Wallet: () => import("@/routes/Wallet"),
  Grievances: () => import("@/routes/Grievances"),
  Profile: () => import("@/routes/Profile"),
  NotFound: () => import("@/routes/NotFound"),
  GovLogin: () => import("@/routes/gov/GovLogin"),
  GovLayout: () => import("@/routes/gov/GovLayout"),
  Queue: () => import("@/routes/gov/Queue"),
  CaseFile: () => import("@/routes/gov/CaseFile"),
  AuthorSchemes: () => import("@/routes/gov/AuthorSchemes"),
  SchemeBuilder: () => import("@/routes/gov/SchemeBuilder"),
  Approvals: () => import("@/routes/gov/Approvals"),
  Sanction: () => import("@/routes/gov/Sanction"),
  Command: () => import("@/routes/gov/Command"),
  Audit: () => import("@/routes/gov/Audit"),
} satisfies Record<string, Loader>;

const lazyPages = Object.fromEntries(Object.entries(loaders).map(([k, l]) => [k, lazy(l)])) as unknown as Record<keyof typeof loaders, LazyExoticComponent<ComponentType>>;
/** Home is the landing (LCP) page, so it ships in the main bundle; every other route is code-split. */
export const Pages = { ...lazyPages, Home: HomePage as unknown as LazyExoticComponent<ComponentType> };

const table: [RegExp, Loader][] = [
  [/^\/$/, loaders.Home],
  [/^\/eligibility/, loaders.Eligibility],
  [/^\/schemes\/[^/]+/, loaders.SchemeDetail],
  [/^\/schemes/, loaders.Schemes],
  [/^\/verify/, loaders.Verify],
  [/^\/open-data/, loaders.OpenData],
  [/^\/(info|screen-reader-access)/, loaders.InfoPage],
  [/^\/login/, loaders.Login],
  [/^\/me/, loaders.Dashboard],
  [/^\/apply/, loaders.Apply],
  [/^\/track\/.+/, loaders.TrackDetail],
  [/^\/track/, loaders.Track],
  [/^\/wallet/, loaders.Wallet],
  [/^\/grievances/, loaders.Grievances],
  [/^\/profile/, loaders.Profile],
  [/^\/gov\/login/, loaders.GovLogin],
  [/^\/gov\/queue/, loaders.Queue],
  [/^\/gov\/case/, loaders.CaseFile],
  [/^\/gov\/schemes\/.+/, loaders.SchemeBuilder],
  [/^\/gov\/schemes/, loaders.AuthorSchemes],
  [/^\/gov\/approvals/, loaders.Approvals],
  [/^\/gov\/sanction/, loaders.Sanction],
  [/^\/gov\/command/, loaders.Command],
  [/^\/gov\/audit/, loaders.Audit],
];

const done = new Set<Loader>();
/** Preload the chunk for a path (on hover / touchstart). */
export function preload(path: string) {
  const hit = table.find(([re]) => re.test(path.split("?")[0]));
  if (hit && !done.has(hit[1])) {
    done.add(hit[1]);
    hit[1]().catch(() => done.delete(hit[1]));
  }
}
