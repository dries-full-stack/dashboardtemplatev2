import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize email for consistent matching: lowercase and trim whitespace.
 * Returns undefined if email is null, undefined, or empty after trimming.
 */
export function normalizeEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined;
  const normalized = email.toLowerCase().trim();
  return normalized || undefined;
}
