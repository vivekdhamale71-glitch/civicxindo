import { db } from "@/db";
import { changed, local } from "./client";

export const listNotifications = (userId: string) =>
  local(async () => (await db.notifications.where("userId").equals(userId).toArray()).sort((a, b) => b.at.localeCompare(a.at)));

export const markAllRead = (userId: string) =>
  local(async () => {
    await db.notifications.where("userId").equals(userId).modify({ read: true });
    changed();
  });

export const markRead = (id: string) =>
  local(async () => {
    await db.notifications.update(id, { read: true });
    changed();
  });
