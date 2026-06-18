export type PathSegment = string | number;

export type IssueCode =
  | "required"
  | "invalid_type"
  | "invalid_literal"
  | "invalid_enum_value"
  | "too_small"
  | "too_big"
  | "invalid_string"
  | "invalid_number"
  | "invalid_date"
  | "invalid_array"
  | "invalid_union"
  | "invalid_intersection"
  | "invalid_discriminator"
  | "unknown_keys"
  | "invalid_tuple_length"
  | "custom";

export interface ValdixIssue {
  path: PathSegment[];
  code: IssueCode;
  message: string;
  field?: string;
  description?: string;
  expected?: string;
  received?: string;
  minimum?: number;
  maximum?: number;
  inclusive?: boolean;
  exact?: boolean;
  kind?: "string" | "number" | "bigint" | "array" | "date" | "tuple" | "set" | "map";
  validation?: string;
  keys?: string[];
  options?: unknown[];
  literal?: unknown;
  discriminator?: string;
  allowedDiscriminators?: string[];
  constructorName?: string;
}

export interface ParseOptions {
  lang?: string;
  abortEarly?: boolean;
}

export type IssueInput = {
  code: IssueCode;
  message?: string;
  path?: PathSegment[];
} & Record<string, unknown>;

export interface SafeParseSuccess<T> { success: true; data: T; }
export interface SafeParseFailure { success: false; errors: ValdixIssue[]; }
export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export type MessageTemplate = string | ((issue: Omit<ValdixIssue, "message">) => string);

export type LocaleCatalog = Partial<Record<IssueCode, MessageTemplate>>;

export type ErrorMap = (
  issue: Omit<ValdixIssue, "message">,
  ctx: { defaultError: string; lang: string }
) => string;

export type SchemaDescription = { description?: string };
