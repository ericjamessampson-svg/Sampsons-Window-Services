import type { AppData } from "./types";

/**
 * Link for the free booking page. All the info rides in the link itself,
 * so it works without accounts or a server.
 */
export function bookingUrl(origin: string, data: AppData): string {
  const q = new URLSearchParams();
  if (data.business.name) q.set("b", data.business.name);
  if (data.business.phone) q.set("p", data.business.phone.replace(/[^\d+]/g, ""));
  const services = data.profile?.services ?? [];
  if (services.length) q.set("s", services.join("|"));
  if (data.profile?.homeBase) q.set("a", data.profile.homeBase);
  return `${origin}/book?${q.toString()}`;
}

/** Opens the texting app with a message ready to send. */
export function smsLink(phone: string, body: string): string {
  return `sms:${phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(body)}`;
}
