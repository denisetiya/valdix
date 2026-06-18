import type { ValdixIssue, LocaleCatalog, MessageTemplate } from "./types.js";

const applyTemplate = (
  template: MessageTemplate | undefined,
  issue: Omit<ValdixIssue, "message">
): string | undefined => {
  if (!template) return undefined;
  return typeof template === "function" ? template(issue) : template;
};

export const resolveMessage = (
  issue: Omit<ValdixIssue, "message">,
  lang: string,
  locales: Map<string, LocaleCatalog>,
  explicitMessage?: string
): string => {
  if (explicitMessage) return explicitMessage;

  const catalog = locales.get(lang) ?? locales.get("en");
  const fallback = locales.get("en");

  return (
    applyTemplate(catalog?.[issue.code], issue) ??
    applyTemplate(fallback?.[issue.code], issue) ??
    "Validation error"
  );
};
