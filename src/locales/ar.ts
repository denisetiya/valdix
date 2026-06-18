import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const AR: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} مطلوب`,
  invalid_type: (i) => `المتوقع {exp}، لكن تم استلام {rec}`,
  invalid_literal: (i) => `يجب أن يكون {lit}`,
  invalid_enum_value: (i) => `يجب أن يكون أحد هذه: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `يجب أن يكون بالضبط {n} حرف` : `على الأقل {n} حرف`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `يجب أن يكون بالضبط {n}` : `على الأقل {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `على الأقل {n} عنصر`;
    }
    return `القيمة صغيرة جداً`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `يجب أن يكون بالضبط {n} حرف` : `بحد أقصى {n} حرف`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `يجب أن يكون بالضبط {n}` : `بحد أقصى {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `بحد أقصى {n} عنصر`;
    }
    return `القيمة كبيرة جداً`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `هذا لا يبدو كعنوان بريد إلكتروني صالح`;
    if (i.validation === "url") return `هذا لا يبدو كرابط صالح`;
    if (i.validation === "uuid") return `هذا ليس UUID صالح`;
    if (i.validation === "regex") return `التنسيق غير صحيح`;
    if (i.validation === "alpha") return `حروف فقط (a-z, A-Z)`;
    if (i.validation === "numeric") return `أرقام فقط (0-9)`;
    if (i.validation === "symbol") return `رموز فقط، بدون حروف أو أرقام`;
    if (i.validation === "phone") return `رقم الهاتف غير صالح`;
    return `تنسيق غير صالح`;
  },
  invalid_number: () => `الرجاء إدخال رقم صالح`,
  invalid_date: () => `الرجاء إدخال تاريخ صالح`,
  invalid_array: () => `المتوقع قائمة`,
  invalid_union: () => `لا يتطابق مع أي تنسيق متوقع`,
  invalid_intersection: () => `لا يستوفي جميع المتطلبات`,
  invalid_discriminator: (i) => `نوع غير معروف "{disc}". المتوقع: {allowed}`,
  unknown_keys: (i) => `حقول غير متوقعة: {keys}`,
  invalid_tuple_length: (i) => `المتوقع {min} عنصر، تم استلام {max}`,
  custom: () => `هذه القيمة غير صالحة`,
};
