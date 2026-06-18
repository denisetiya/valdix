import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const ZH_TW: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"}不能為空`,
  invalid_type: (i) => `應為{exp},但收到了{rec}`,
  invalid_literal: (i) => `必須等於{lit}`,
  invalid_enum_value: (i) => `應為以下之一:{opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `必須剛好是{n}個字元` : `至少需要{n}個字元`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `必須剛好是{n}` : `不能小於{n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `至少需要{n}項`;
    }
    return `值太小了`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `必須剛好是{n}個字元` : `最多{n}個字元`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `必須剛好是{n}` : `不能大於{n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `最多{n}項`;
    }
    return `值太大了`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `這看起來不像有效的電子郵件`;
    if (i.validation === "url") return `這看起來不像有效的網址`;
    if (i.validation === "uuid") return `這看起來不像有效的UUID`;
    if (i.validation === "regex") return `格式不對`;
    if (i.validation === "alpha") return `只能包含字母`;
    if (i.validation === "numeric") return `只能包含數字`;
    if (i.validation === "symbol") return `只能包含符號,不能有字母或數字`;
    if (i.validation === "phone") return `手機號碼格式不對`;
    return `格式無效`;
  },
  invalid_number: () => `請輸入有效的數字`,
  invalid_date: () => `請輸入有效的日期`,
  invalid_array: () => `應為陣列`,
  invalid_union: () => `不符合任何預期格式`,
  invalid_intersection: () => `不滿足所有要求`,
  invalid_discriminator: (i) => `未知的類型"{disc}"。應為:{allowed}`,
  unknown_keys: (i) => `出現意外欄位:{keys}`,
  invalid_tuple_length: (i) => `應為{min}項,實際收到{max}項`,
  custom: () => `這個值無效`,
};
