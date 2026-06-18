import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const KO: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"}을(를) 입력해주세요`,
  invalid_type: (i) => `{exp}이(가) 필요하지만 {rec}을(를) 받았습니다`,
  invalid_literal: (i) => `{lit}이어야 합니다`,
  invalid_enum_value: (i) => `다음 중 하나여야 합니다: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `정확히 {n}자여야 해요` : `최소 {n}자 이상이어야 해요`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `정확히 {n}이어야 해요` : `{n} 이상이어야 해요`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `최소 {n}개 필요해요`;
    }
    return `값이 너무 작아요`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `정확히 {n}자여야 해요` : `최대 {n}자까지 가능해요`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `정확히 {n}이어야 해요` : `{n} 이하여야 해요`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `최대 {n}개까지 가능해요`;
    }
    return `값이 너무 커요`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `올바른 이메일 형식이 아니에요`;
    if (i.validation === "url") return `올바른 URL이 아니에요`;
    if (i.validation === "uuid") return `올바른 UUID가 아니에요`;
    if (i.validation === "regex") return `형식이 맞지 않아요`;
    if (i.validation === "alpha") return `문자만 입력 가능해요`;
    if (i.validation === "numeric") return `숫자만 입력 가능해요`;
    if (i.validation === "symbol") return `기호만 가능해요, 문자나 숫자는 안 돼요`;
    if (i.validation === "phone") return `전화번호 형식이 아니에요`;
    return `형식이 올바르지 않아요`;
  },
  invalid_number: () => `올바른 숫자를 입력해주세요`,
  invalid_date: () => `올바른 날짜를 입력해주세요`,
  invalid_array: () => `배열이어야 해요`,
  invalid_union: () => `어떤 형식과도 맞지 않아요`,
  invalid_intersection: () => `모든 조건을 충족하지 않아요`,
  invalid_discriminator: (i) => `알 수 없는 타입 "{disc}". 다음 중 하나여야 해요: {allowed}`,
  unknown_keys: (i) => `예상치 못한 필드: {keys}`,
  invalid_tuple_length: (i) => `{min}개여야 하는데 {max}개를 받았어요`,
  custom: () => `이 값은 유효하지 않아요`,
};
