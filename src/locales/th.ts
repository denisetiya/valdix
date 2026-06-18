import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const TH: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"}กรุณากรอก`,
  invalid_type: (i) => `คาดว่าจะเป็น{exp} แต่ได้รับ{rec}`,
  invalid_literal: (i) => `ต้องเป็น{lit}`,
  invalid_enum_value: (i) => `ต้องเป็นหนึ่งใน: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `ต้องมีพอดี {n} ตัวอักษร` : `ต้องมีอย่างน้อย {n} ตัวอักษร`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `ต้องเป็น {n} พอดี` : `ต้องไม่น้อยกว่า {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `ต้องมีอย่างน้อย {n} รายการ`;
    }
    return `ค่าน้อยเกินไป`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `ต้องมีพอดี {n} ตัวอักษร` : `ต้องไม่เกิน {n} ตัวอักษร`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `ต้องเป็น {n} พอดี` : `ต้องไม่เกิน {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `ต้องไม่เกิน {n} รายการ`;
    }
    return `ค่ามากเกินไป`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `อีเมลนี้ดูไม่ถูกต้อง`;
    if (i.validation === "url") return `URL นี้ดูไม่ถูกต้อง`;
    if (i.validation === "uuid") return `UUID นี้ไม่ถูกต้อง`;
    if (i.validation === "regex") return `รูปแบบไม่ถูกต้อง`;
    if (i.validation === "alpha") return `ต้องเป็นตัวอักษรเท่านั้น`;
    if (i.validation === "numeric") return `ต้องเป็นตัวเลขเท่านั้น`;
    if (i.validation === "symbol") return `ต้องเป็นสัญลักษณ์เท่านั้น`;
    if (i.validation === "phone") return `เบอร์โทรศัพท์ไม่ถูกต้อง`;
    return `รูปแบบไม่ถูกต้อง`;
  },
  invalid_number: () => `กรุณาใส่ตัวเลขที่ถูกต้อง`,
  invalid_date: () => `กรุณาใส่วันที่ที่ถูกต้อง`,
  invalid_array: () => `คาดว่าจะเป็นรายการ`,
  invalid_union: () => `ไม่ตรงกับรูปแบบใดเลย`,
  invalid_intersection: () => `ยังไม่ตรงตามเงื่อนไขทั้งหมด`,
  invalid_discriminator: (i) => `ไม่รู้จักประเภท "{disc}" คาดว่าจะเป็น: {allowed}`,
  unknown_keys: (i) => `ช่องที่ไม่คาดคิด: {keys}`,
  invalid_tuple_length: (i) => `คาดว่าจะเป็น {min} รายการ ได้รับ {max}`,
  custom: () => `ค่านี้ไม่ถูกต้อง`,
};
