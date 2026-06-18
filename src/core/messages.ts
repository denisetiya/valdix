import type { ValdixIssue, LocaleCatalog, ErrorMap, PathSegment } from "./types.js";

const humanize = (raw: string): string => {
  if (!raw) return "";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .trim();
};

export const interpolate = (str: string, vars: Record<string, string>): string =>
  str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

export const fieldFromPath = (path: PathSegment[]): string | undefined => {
  for (let i = path.length - 1; i >= 0; i--) {
    const seg = path[i];
    if (typeof seg === "string" && /[a-zA-Z0-9]/.test(seg)) return seg;
  }
  return undefined;
};

const buildVars = (issue: Omit<ValdixIssue, "message">): Record<string, string> => {
  const label = issue.description ?? (issue.field ? humanize(issue.field) : "");
  return {
    field: label,
    expected: String(issue.expected ?? ""),
    received: String(issue.received ?? ""),
    path: issue.path.map(String).join("."),
    minimum: String(issue.minimum ?? ""),
    maximum: String(issue.maximum ?? ""),
    validation: String(issue.validation ?? ""),
    keys: (issue.keys ?? []).join(", "),
    options: (issue.options ?? []).map(String).join(", "),
    literal: String(issue.literal ?? ""),
    discriminator: String(issue.discriminator ?? ""),
  };
};

const applyTemplate = (
  template: string | ((issue: Omit<ValdixIssue, "message">) => string) | undefined,
  issue: Omit<ValdixIssue, "message">
): string | undefined => {
  if (!template) return undefined;
  const raw = typeof template === "function" ? template(issue) : template;
  return interpolate(raw, buildVars(issue));
};

export const resolveMessage = (
  issue: Omit<ValdixIssue, "message">,
  lang: string,
  locales: Record<string, LocaleCatalog>,
  errorMap?: ErrorMap
): string => {
  const catalog = locales[lang] ?? locales["en"];
  const fallback = locales["en"];
  const defaultError =
    applyTemplate(catalog?.[issue.code], issue) ??
    applyTemplate(fallback?.[issue.code], issue) ??
    "Validation error";

  if (errorMap) return errorMap(issue, { defaultError, lang });
  return defaultError;
};
