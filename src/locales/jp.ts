import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const JP: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "この項目"}は必須です`,
  invalid_type: (i) => `${i.expected ?? "有効な値"}が必要ですが、${i.received ?? "不明"}が入力されました`,
  invalid_literal: (i) => `リテラル ${String(i.literal)} が必要です`,
  invalid_enum_value: (i) => `次のいずれかを選択してください: ${(i.options ?? []).map(String).join("、")}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact
        ? `${i.minimum}文字で入力してください`
        : `${i.minimum}文字以上で入力してください`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact
        ? `${i.minimum}にしてください`
        : `${i.minimum}以上にしてください`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `少なくとも${i.minimum}個必要です`;
    }
    return "値が小さすぎます";
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact
        ? `${i.maximum}文字で入力してください`
        : `${i.maximum}文字以内で入力してください`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact
        ? `${i.maximum}にしてください`
        : `${i.maximum}以下にしてください`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `最大${i.maximum}個までです`;
    }
    return "値が大きすぎます";
  },
  invalid_string: (i) => {
    if (i.validation === "email") return "メールアドレスの形式が正しくありません";
    if (i.validation === "url") return "URLの形式が正しくありません";
    if (i.validation === "uuid") return "UUIDの形式が正しくありません";
    if (i.validation === "regex") return "フォーマットが正しくありません";
    if (i.validation === "alpha") return "英字のみ入力できます（a-z、A-Z）";
    if (i.validation === "numeric") return "数字のみ入力できます（0-9）";
    if (i.validation === "symbol") return "記号のみ、英数字は使えません";
    if (i.validation === "phone") return "電話番号の形式が正しくありません";
    return "形式が正しくありません";
  },
  invalid_number: () => "有効な数字を入力してください",
  invalid_date: () => "有効な日付を入力してください",
  invalid_array: () => "リスト形式である必要があります",
  invalid_union: () => "いずれの形式にも一致しませんでした",
  invalid_intersection: () => "すべての条件を満たしていません",
  invalid_discriminator: (i) => `不明なタイプ「${i.discriminator}」。次のいずれか: ${(i.allowedDiscriminators ?? []).join("、")}`,
  unknown_keys: (i) => `不明なフィールド: ${(i.keys ?? []).join("、")}`,
  invalid_tuple_length: (i) => `${i.minimum ?? "?"}個の項目が必要ですが、${i.maximum ?? "?"}個 received`,
  custom: () => "この値は無効です",
};
