import type { ValdixIssue, IssueInput, ParseOptions, LocaleCatalog, ErrorMap, PathSegment } from "./types.js";
import { resolveMessage, fieldFromPath, interpolate } from "./messages.js";

export interface ParseContext {
  lang: string;
  abortEarly: boolean;
  pathStack: (string | number)[];
  issues: ValdixIssue[];
  locales: LocaleRegistrar;
  errorMap?: ErrorMap;
  descriptionStack: string[];
  addIssue: (issue: IssueInput) => void;
  fork: () => ParseContext;
}

// Plain object instead of Map. About 2x faster lookup, smaller allocation.
export type LocaleRegistrar = Record<string, LocaleCatalog>;

// Class instead of closure factory. One allocation per parse with no
// per-instance closures; addIssue and fork live on the prototype.
export class ParseContextImpl implements ParseContext {
  pathStack: (string | number)[] = [];
  issues: ValdixIssue[] = [];
  descriptionStack: string[] = [];
  constructor(
    public lang: string,
    public abortEarly: boolean,
    public locales: LocaleRegistrar,
    public errorMap?: ErrorMap
  ) {}
  addIssue(issue: IssueInput): void {
    pushIssue(this, issue);
  }
  fork(): ParseContext {
    const f = new ParseContextImpl(this.lang, this.abortEarly, this.locales, this.errorMap);
    f.descriptionStack = this.descriptionStack;
    return f;
  }
}

export const createContext = (
  lang: string,
  abortEarly: boolean,
  locales: LocaleRegistrar,
  errorMap?: ErrorMap,
  descriptionStack: string[] = []
): ParseContext => {
  const ctx = new ParseContextImpl(lang, abortEarly, locales, errorMap);
  ctx.descriptionStack = descriptionStack;
  return ctx;
};

const pushIssue = (ctx: ParseContextImpl, issue: IssueInput): void => {
  const stackLen = ctx.pathStack.length;
  const issuePath: PathSegment[] | undefined = issue.path;
  const issuePathLen = issuePath === undefined ? 0 : issuePath.length;
  let fullPath: (string | number)[];
  if (stackLen === 0 && issuePathLen === 0) {
    fullPath = EMPTY_PATH;
  } else if (issuePathLen === 0) {
    fullPath = stackLen === 0 ? [] : ctx.pathStack.slice();
  } else if (stackLen === 0) {
    fullPath = (issuePath as (string | number)[]).slice();
  } else {
    fullPath = new Array(stackLen + issuePathLen);
    for (let i = 0; i < stackLen; i++) fullPath[i] = ctx.pathStack[i]!;
    for (let i = 0; i < issuePathLen; i++) fullPath[stackLen + i] = issuePath![i] as string | number;
  }

  const description = ctx.descriptionStack[ctx.descriptionStack.length - 1];
  const field = fieldFromPath(fullPath);

  const base: ValdixIssue = {
    code: issue.code,
    path: fullPath,
    field,
    description,
    message: "",
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

  let message: string;
  if (issue.message) {
    const fieldLabel = description ?? (field ? field.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase() : "");
    message = interpolate(issue.message, {
      field: fieldLabel,
      path: fullPath.map(String).join("."),
      expected: issue.expected == null ? "" : String(issue.expected as any),
      received: issue.received == null ? "" : String(issue.received as any),
      minimum: issue.minimum == null ? "" : String(issue.minimum as any),
      maximum: issue.maximum == null ? "" : String(issue.maximum as any),
      validation: (issue.validation as string | undefined) ?? "",
      literal: issue.literal == null ? "" : String(issue.literal as any),
      discriminator: (issue.discriminator as string | undefined) ?? "",
      keys: Array.isArray(issue.keys) ? issue.keys.join(", ") : "",
      options: Array.isArray(issue.options) ? issue.options.join(", ") : "",
    });
  } else {
    message = resolveMessage(base, ctx.lang, ctx.locales, ctx.errorMap);
  }

  base.message = message;
  ctx.issues.push(base);
};

export const createParseContext = (
  options: ParseOptions | undefined,
  locales: LocaleRegistrar,
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

// Shared empty array for paths. Avoids one allocation per issue at root.
const EMPTY_PATH: (string | number)[] = Object.freeze([]) as unknown as (string | number)[];
