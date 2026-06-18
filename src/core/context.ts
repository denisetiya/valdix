import type { ValdixIssue, IssueInput, ParseOptions, LocaleCatalog } from "./types.js";
import { resolveMessage } from "./messages.js";

export interface ParseContext {
  lang: string;
  abortEarly: boolean;
  path: string[];
  issues: ValdixIssue[];
  locales: Map<string, LocaleCatalog>;
  addIssue: (issue: IssueInput) => void;
  fork: () => ParseContext;
  childContext: (key: string) => ParseContext;
}

export const createContext = (
  lang: string,
  abortEarly: boolean,
  locales: Map<string, LocaleCatalog>
): ParseContext => {
  const ctx: ParseContext = {
    lang,
    abortEarly,
    path: [],
    issues: [],
    locales,
    addIssue(issue: IssueInput) {
      const fullPath = issue.path
        ? [...ctx.path, ...issue.path.map(String)]
        : [...ctx.path];

      const base: Omit<ValdixIssue, "message"> = {
        code: issue.code,
        path: fullPath,
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

      const message = resolveMessage(base, ctx.lang, ctx.locales, issue.message);
      ctx.issues.push({ ...base, message });
    },
    fork() {
      return createContext(ctx.lang, ctx.abortEarly, ctx.locales);
    },
    childContext(key: string) {
      const child = createContext(ctx.lang, ctx.abortEarly, ctx.locales);
      child.path = [...ctx.path, key];
      return child;
    },
  };
  return ctx;
};

export const createParseContext = (
  options: ParseOptions | undefined,
  locales: Map<string, LocaleCatalog>,
  defaultLang: string
): ParseContext => {
  return createContext(
    options?.lang ?? defaultLang,
    options?.abortEarly ?? false,
    locales
  );
};

export interface InternalOk<T> {
  ok: true;
  value: T;
}

export interface InternalFail {
  ok: false;
}

export type InternalResult<T> = InternalOk<T> | InternalFail;

export const ok = <T>(value: T): InternalOk<T> => ({ ok: true, value });
export const invalid: InternalFail = { ok: false };
