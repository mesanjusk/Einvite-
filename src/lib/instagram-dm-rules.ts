/**
 * Which DM auto-reply rule, if any, answers an incoming message.
 *
 * Kept apart from the webhook route so the matching itself is testable
 * without a database or a Meta payload. The rule that replies is the
 * highest-priority active rule whose pattern matches; nothing matching means
 * nothing is sent, which is the whole point of the rules existing — the
 * account used to answer every DM with one canned line.
 */

export type DmMatchType = "EXACT" | "CONTAINS" | "STARTS_WITH" | "ANY";

export type DmRuleLike = {
  matchType: DmMatchType;
  keyword: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
};

function matchesRule(rule: DmRuleLike, message: string) {
  // ANY is the explicit catch-all and carries no keyword. Every other type
  // needs one; a keyword-less CONTAINS rule would match everything by
  // accident, which is exactly the behaviour being replaced.
  if (rule.matchType === "ANY") return true;

  const keyword = rule.keyword?.trim().toLowerCase();
  if (!keyword) return false;

  switch (rule.matchType) {
    case "EXACT":
      return message === keyword;
    case "STARTS_WITH":
      return message.startsWith(keyword);
    case "CONTAINS":
      return message.includes(keyword);
  }
}

/**
 * The rule that should answer `text`, or null when no active rule matches.
 *
 * Ties on priority are broken by age so the ordering is stable between
 * calls: an admin adding a second rule at the same priority never silently
 * displaces the one already replying.
 */
export function selectDmRule<T extends DmRuleLike>(rules: T[], text: string): T | null {
  const message = text.trim().toLowerCase();
  if (!message) return null;

  const ordered = [...rules]
    .filter((rule) => rule.isActive)
    .sort(
      (a, b) =>
        b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime(),
    );

  return ordered.find((rule) => matchesRule(rule, message)) ?? null;
}
