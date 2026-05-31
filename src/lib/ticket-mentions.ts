import type { AssignableUser } from "@/lib/tickets-api";
import { formatAssigneeLabel } from "@/lib/tickets-api";

/** @[Nama](user:uuid) */
export const MENTION_TOKEN_RE = /@\[([^\]]+)\]\(user:([0-9a-f-]{36})\)/g;

export function buildMentionToken(user: Pick<AssignableUser, "id" | "display_name">) {
  const name = user.display_name.replace(/[\[\]]/g, "");
  return `@[${name}](user:${user.id})`;
}

export function getMentionContext(text: string, cursor: number) {
  const before = text.slice(0, cursor);
  const match = before.match(/(?:^|\s)@([^\s@[\]()]*?)$/);
  if (!match) return null;
  const query = match[1] ?? "";
  const start = before.length - query.length - 1;
  return { query, start };
}

export function insertMentionToken(
  text: string,
  start: number,
  cursor: number,
  token: string,
) {
  const next = `${text.slice(0, start)}${token} ${text.slice(cursor)}`;
  return { text: next, cursor: start + token.length + 1 };
}

export function filterMentionUsers(users: AssignableUser[], query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return users.slice(0, limit);
  return users
    .filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export type MentionTextPart =
  | { type: "text"; value: string }
  | { type: "mention"; name: string; userId: string };

export function splitMentionText(text: string): MentionTextPart[] {
  if (!text) return [];
  const parts: MentionTextPart[] = [];
  let last = 0;
  const re = new RegExp(MENTION_TOKEN_RE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    parts.push({ type: "mention", name: match[1], userId: match[2] });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }

  return parts.length ? parts : [{ type: "text", value: text }];
}

/** Untuk pratinjau markdown deskripsi — mention jadi bold @Nama */
export function mentionsToMarkdownEmphasis(text: string) {
  return text.replace(MENTION_TOKEN_RE, (_, name: string) => `**@${name}**`);
}

export function mentionUserLabel(user: AssignableUser) {
  return formatAssigneeLabel(user);
}
