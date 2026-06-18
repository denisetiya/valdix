import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const HI: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} जरूरी है`,
  invalid_type: (i) => `{exp} चाहिए था, लेकिन {rec} मिला`,
  invalid_literal: (i) => `{lit} होना चाहिए`,
  invalid_enum_value: (i) => `इनमें से एक होना चाहिए: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `बिल्कुल {n} अक्षर होने चाहिए` : `कम से कम {n} अक्षर चाहिए`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `बिल्कुल {n} होना चाहिए` : `कम से कम {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `कम से कम {n} चीज़ें चाहिए`;
    }
    return `मान बहुत छोटा है`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `बिल्कुल {n} अक्षर होने चाहिए` : `ज़्यादा से ज़्यादा {n} अक्षर`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `बिल्कुल {n} होना चाहिए` : `ज़्यादा से ज़्यादा {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `ज़्यादा से ज़्यादा {n} चीज़ें`;
    }
    return `मान बहुत बड़ा है`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `यह सही ईमेल नहीं लगता`;
    if (i.validation === "url") return `यह सही URL नहीं लगता`;
    if (i.validation === "uuid") return `यह सही UUID नहीं है`;
    if (i.validation === "regex") return `फॉर्मेट सही नहीं है`;
    if (i.validation === "alpha") return `सिर्फ अक्षर (a-z, A-Z)`;
    if (i.validation === "numeric") return `सिर्फ अंक (0-9)`;
    if (i.validation === "symbol") return `सिर्फ चिह्न, अक्षर या अंक नहीं`;
    if (i.validation === "phone") return `फ़ोन नंबर सही नहीं है`;
    return `गलत फॉर्मेट`;
  },
  invalid_number: () => `सही संख्या डालें`,
  invalid_date: () => `सही तारीख डालें`,
  invalid_array: () => `एक सूची चाहिए थी`,
  invalid_union: () => `कोई भी फॉर्मेट मेल नहीं खाता`,
  invalid_intersection: () => `सारी शर्तें पूरी नहीं हुईं`,
  invalid_discriminator: (i) => `अज्ञात प्रकार "{disc}"। अपेक्षित: {allowed}`,
  unknown_keys: (i) => `अप्रत्याशित फ़ील्ड: {keys}`,
  invalid_tuple_length: (i) => `{min} चीज़ें चाहिए थीं, {max} मिलीं`,
  custom: () => `यह मान सही नहीं है`,
};
