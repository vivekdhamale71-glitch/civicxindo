import { db } from "@/db";
import { net } from "./client";
import { STATES } from "@/lib/reference";

export const homeStats = () =>
  net(async () => {
    const schemes = (await db.schemes.toArray()).filter((s) => s.status === "published" || s.status === "paused");
    return {
      schemes: schemes.length,
      beneficiaries: schemes.reduce((n, s) => n + s.beneficiaries, 0),
      disbursed: schemes.reduce((n, s) => n + s.budget.spent, 0),
    };
  });

/** Anonymised aggregates for the Open Data page. */
export const openData = () =>
  net(async () => {
    const schemes = (await db.schemes.toArray()).filter((s) => s.status === "published" || s.status === "paused");
    const apps = await db.applications.toArray();
    const byScheme = schemes
      .map((s) => ({ id: s.id, name: s.name, code: s.code, spent: s.budget.spent, total: s.budget.total, beneficiaries: s.beneficiaries }))
      .sort((a, b) => b.spent - a.spent);
    const totalBen = byScheme.reduce((n, s) => n + s.beneficiaries, 0);
    // Deterministic state split weighted by a population-like index plus live application counts.
    const weights = [53, 31, 124, 29, 20, 70, 28, 38, 67, 35, 85, 124, 46, 30, 79, 77, 38, 230, 11, 99];
    const wsum = weights.reduce((a, b) => a + b, 0);
    const byState = STATES.map((st, i) => ({
      state: st.name,
      hi: st.hi,
      beneficiaries: Math.round((totalBen * weights[i]) / wsum) + apps.filter((a) => a.state === st.name && a.stage === "credited").length,
    })).sort((a, b) => b.beneficiaries - a.beneficiaries);
    const months: { month: string; monthHi: string; amount: number; applications: number }[] = [];
    const now = new Date();
    const totalSpent = byScheme.reduce((n, s) => n + s.spent, 0);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const season = 1 + 0.35 * Math.sin((d.getMonth() / 12) * Math.PI * 2 + 1.2);
      months.push({
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        monthHi: d.toLocaleDateString("hi-IN", { month: "short" }),
        amount: Math.round((totalSpent / 12) * season * (0.85 + (11 - i) * 0.025)),
        applications: Math.round(48000 * season * (0.8 + (11 - i) * 0.03)) + (i === 0 ? apps.length : 0),
      });
    }
    const byStage = ["submitted", "auto_verified", "district_verified", "sanctioned", "credited"].map((stage) => ({
      stage,
      count: apps.filter((a) => a.stage === stage && a.status === "active").length,
    }));
    return { byScheme, byState, months, byStage, totalBen, totalSpent, updated: new Date().toISOString() };
  });
