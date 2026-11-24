import { db } from "@/db";
import type { Citizen } from "@/lib/types";
import { changed, local, net } from "./client";
import { uid } from "@/lib/utils";

export const requestOtp = (mobile: string) => net(async () => ({ sent: /^[6-9]\d{9}$/.test(mobile) }));

/** Demo: any 6-digit OTP works. Unknown numbers get a new profile they can complete while applying. */
export const verifyOtp = (mobile: string, otp: string) =>
  net(async () => {
    if (!/^\d{6}$/.test(otp)) throw new Error("invalid_otp");
    const existing = await db.citizens.where("mobile").equals(mobile).first();
    if (existing) return existing;
    const c: Citizen = {
      id: uid("cit-"), mobile, name: "", dob: "2000-01-01", gender: "female", state: "Maharashtra", district: "Pune",
      income: 0, occupation: "student", category: "general", aadhaar: `XXXX-XXXX-${mobile.slice(-4)}`, bankAccount: "", ifsc: "",
    };
    await db.citizens.add(c);
    return c;
  });

export const getCitizen = (id: string) => local(async () => (await db.citizens.get(id)) ?? null);

export const updateCitizen = (id: string, patch: Partial<Citizen>) =>
  local(async () => {
    await db.citizens.update(id, patch);
    changed();
    return (await db.citizens.get(id))!;
  });

export const listDemoCitizens = () => local(async () => (await db.citizens.toArray()).filter((c) => c.demo).sort((a, b) => a.mobile.localeCompare(b.mobile)));
