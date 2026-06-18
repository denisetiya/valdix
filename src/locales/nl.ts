import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const NL: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} is verplicht`,
  invalid_type: (i) => `Verwachtte {exp}, maar kreeg {rec}`,
  invalid_literal: (i) => `Moet {lit} zijn`,
  invalid_enum_value: (i) => `Moet een van deze zijn: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Moet precies {n} tekens zijn` : `Minimaal {n} tekens`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Moet precies {n} zijn` : `Minimaal {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Minimaal {n} item(s)`;
    }
    return `Waarde is te klein`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Moet precies {n} tekens zijn` : `Maximaal {n} tekens`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Moet precies {n} zijn` : `Maximaal {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Maximaal {n} item(s)`;
    }
    return `Waarde is te groot`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Dit lijkt geen geldig e-mailadres`;
    if (i.validation === "url") return `Dit lijkt geen geldige URL`;
    if (i.validation === "uuid") return `Dit is geen geldige UUID`;
    if (i.validation === "regex") return `Formaat klopt niet`;
    if (i.validation === "alpha") return `Alleen letters (a-z, A-Z)`;
    if (i.validation === "numeric") return `Alleen cijfers (0-9)`;
    if (i.validation === "symbol") return `Alleen symbolen, geen letters of cijfers`;
    if (i.validation === "phone") return `Dit telefoonnummer is niet geldig`;
    return `Ongeldig formaat`;
  },
  invalid_number: () => `Vul een geldig nummer in`,
  invalid_date: () => `Vul een geldige datum in`,
  invalid_array: () => `Verwachtte een lijst`,
  invalid_union: () => `Geen enkel formaat komt overeen`,
  invalid_intersection: () => `Niet aan alle eisen voldaan`,
  invalid_discriminator: (i) => `Onbekend type "{disc}". Verwacht: {allowed}`,
  unknown_keys: (i) => `Onverwacht veld(en): {keys}`,
  invalid_tuple_length: (i) => `Verwacht {min} item(s), kreeg {max}`,
  custom: () => `Deze waarde is niet geldig`,
};
