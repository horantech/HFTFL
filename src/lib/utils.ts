import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/[\s\-(),.]/g, "");
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) {
    // Bare country-code prefix with no subscriber number → treat as empty
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (digits.length < 7) return null;
    return trimmed;
  }
  if (trimmed.startsWith("00")) return "+" + trimmed.slice(2);
  // Ethiopian patterns
  if (trimmed.startsWith("0")) return "+251" + trimmed.slice(1);
  if (trimmed.startsWith("251")) return "+" + trimmed;
  if (/^9\d{8}$/.test(trimmed)) return "+251" + trimmed;
  // Other international: bare digits with country code, prefix with +
  if (/^\d{10,15}$/.test(trimmed)) return "+" + trimmed;
  return trimmed;
}
