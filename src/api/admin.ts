import { db, getMeta } from "@/db";
import type { Official, Role } from "@/lib/types";
import { audit, changed, local, net } from "./client";
import { uid } from "@/lib/utils";

export const listOfficials = () => net(() => db.officials.toArray());
export const listOfficialsLocal = () => local(() => db.officials.toArray());
export const getOfficial = (id: string) => local(async () => (await db.officials.get(id)) ?? null);
export const listDepartments = () => net(() => db.departments.toArray());

export const setOfficialActive = (id: string, active: boolean, manager: Official) =>
  net(async () => {
    const o = await db.officials.get(id);
    await db.officials.update(id, { active });
    await audit(manager.name, "Portal Manager", active ? "officer_activated" : "officer_deactivated", o?.name ?? id);
    changed();
  });

export const addOfficial = (data: { name: string; role: Role; department: string; district?: string; email: string }, manager: Official) =>
  net(async () => {
    const o: Official = {
      id: uid("off-"), name: data.name, role: data.role, department: data.department, district: data.district, email: data.email, active: true,
      designation: { en: data.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), hi: data.role },
    };
    await db.officials.add(o);
    await audit(manager.name, "Portal Manager", "officer_added", o.name);
    changed();
    return o;
  });

export const addDepartment = (en: string, hi: string, head: string, manager: Official) =>
  net(async () => {
    await db.departments.add({ id: uid("dep-"), name: { en, hi: hi || en }, head });
    await audit(manager.name, "Portal Manager", "department_added", en);
    changed();
  });

export const listAudit = () => net(async () => (await db.audit.orderBy("at").reverse().toArray()));

export const visitorCount = () => local(() => getMeta<number>("visitors", 14_823_917));
