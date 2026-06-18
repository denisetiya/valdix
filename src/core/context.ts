import type { ValdixIssue, IssueInput, ParseOptions, LocaleCatalog, ErrorMap } from "./types.js";
import { resolveMessage, fieldFromPath, interpolate } from "./messages.js";

export interface ParseContext {
  lang: string;
  abortEarly: boolean;
  path: (string | number)[];
  issues: ValdixIssue[];
  locales: Map<string, LocaleCatalog>;
  errorMap?: ErrorMap;
  descriptionStack: string[];
  addIssue: (issue: IssueInput) => void;
  fork: () => ParseContext;
  childContext: (key: string) => ParseContext;
}

export const createContext = (
  lang: string,
  abortEarly: boolean,
  locales: Map<string, LocaleCatalog>,
  errorMap?: ErrorMap,
  descriptionStack: string[] = [],
  isolatedIssues: boolean = false
): ParseContext => {
  const issues: ValdixIssue[] = [];
  const ctx: ParseContext = {
    lang,
    abortEarly,
    path: [],
    issues: isolatedIssues ? [] : issues,
    locales,
    errorMap,
    descriptionStack,
    addIssue(issue: IssueInput) {
      const fullPath = issue.path
        ? [...ctx.path, ...issue.path.map(String)]
        : [...ctx.path];

      const description = ctx.descriptionStack[ctx.descriptionStack.length - 1];
      const field = fieldFromPath(fullPath);

      const base: Omit<ValdixIssue, "message"> = {
        code: issue.code,
        path: fullPath,
        field,
        description,
        expected: issue.expected as string | undefined,
        received: issue.received as string | undefined,
        minimum: issue.minimum as number | undefined,
        maximum: issue.maximum as number | undefined,
        inclusive: issue.inclusive as boolean | undefined,
        exact: issue.exact as boolean | undefined,
        kind: issue.kind as ValdixIssue["kind"],
        validation: issue.validation as string | undefined,
        keys: issue.keys as string[] | undefined,
        options: issue.options as unknown[] | undefined,
        literal: issue.literal,
        discriminator: issue.discriminator as string | undefined,
        allowedDiscriminators: issue.allowedDiscriminators as string[] | undefined,
        constructorName: issue.constructorName as string | undefined,
      };

      const defaultError = resolveMessage(base, ctx.lang, ctx.locales, ctx.errorMap);
      const fieldLabel = description ?? (field ? field.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase() : "");
      const message = issue.message
        ? interpolate(issue.message, {
            field: fieldLabel,
            path: fullPath.map(String).join("."),
            expected: String(issue.expected ?? ""),
            received: String(issue.received ?? ""),
            minimum: String(issue.minimum ?? ""),
            maximum: String(issue.maximum ?? ""),
            validation: String(issue.validation ?? ""),
            literal: String(issue.literal ?? ""),
            discriminator: String(issue.discriminator ?? ""),
            keys: (Array.isArray(issue.keys) ? issue.keys : []).map(String).join(", "),
            options: (Array.isArray(issue.options) ? issue.options : []).map(String).join(", "),
          })
        : defaultError;
      ctx.issues.push({ ...base, message });
    },
    fork() {
      const f = createContext(ctx.lang, ctx.abortEarly, ctx.locales, ctx.errorMap, ctx.descriptionStack, true);
      f.path = [...ctx.path];
      return f;
    },
    childContext(key: string) {
      const child = createContext(ctx.lang, ctx.abortEarly, ctx.locales, ctx.errorMap, ctx.descriptionStack);
      child.path = [...ctx.path, key];
      child.issues = ctx.issues; // share - issues flow to parent
      return child;
    },
  };
  return ctx;
};

export const createParseContext = (
  options: ParseOptions | undefined,
  locales: Map<string, LocaleCatalog>,
  defaultLang: string,
  errorMap?: ErrorMap
): ParseContext => {
  return createContext(
    options?.lang ?? defaultLang,
    options?.abortEarly ?? false,
    locales,
    errorMap
  );
};

export interface InternalOk<T> { ok: true; value: T; }
export interface InternalFail { ok: false; }
export type InternalResult<T> = InternalOk<T> | InternalFail;

export const ok = <T>(value: T): InternalOk<T> => ({ ok: true, value });
export const invalid: InternalFail = { ok: false };
