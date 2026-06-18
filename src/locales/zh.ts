import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const ZH: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"}不能为空`,
  invalid_type: (i) => `应为{exp},但收到了{rec}`,
  invalid_literal: (i) => `必须等于{lit}`,
  invalid_enum_value: (i) => `应为以下之一:{opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `必须正好是{n}个字符` : `至少需要{n}个字符`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `必须正好是{n}` : `不能小于{n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `至少需要{n}项`;
    }
    return `值太小了`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `必须正好是{n}个字符` : `最多{n}个字符`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `必须正好是{n}` : `不能大于{n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `最多{n}项`;
    }
    return `值太大了`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `这看起来不像有效的邮箱`;
    if (i.validation === "url") return `这看起来不像有效的网址`;
    if (i.validation === "uuid") return `这看起来不像有效的UUID`;
    if (i.validation === "regex") return `格式不对`;
    if (i.validation === "alpha") return `只能包含字母`;
    if (i.validation === "numeric") return `只能包含数字`;
    if (i.validation === "symbol") return `只能包含符号,不能有字母或数字`;
    if (i.validation === "phone") return `手机号格式不对`;
    return `格式无效`;
  },
  invalid_number: () => `请输入有效的数字`,
  invalid_date: () => `请输入有效的日期`,
  invalid_array: () => `应为数组`,
  invalid_union: () => `不符合任何预期格式`,
  invalid_intersection: () => `不满足所有要求`,
  invalid_discriminator: (i) => `未知的类型"{disc}"。应为:{allowed}`,
  unknown_keys: (i) => `出现意外字段:{keys}`,
  invalid_tuple_length: (i) => `应为{min}项,实际收到{max}项`,
  custom: () => `这个值无效`,
};
