import { blockedWords } from "@/lib/mock-data";

export function findBlockedWords(input: string): string[] {
  const lower = input.toLowerCase();
  return blockedWords.filter((word) => lower.includes(word));
}

export function canPublish(input: string): { ok: boolean; blocked: string[] } {
  const blocked = findBlockedWords(input);
  return { ok: blocked.length === 0, blocked };
}
