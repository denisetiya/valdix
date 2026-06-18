import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const DE: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} ist erforderlich`,
  invalid_type: (i) => `Erwartet {exp}, aber {rec} bekommen`,
  invalid_literal: (i) => `Muss {lit} sein`,
  invalid_enum_value: (i) => `Muss eins davon sein: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Muss genau {n} Zeichen sein` : `Mindestens {n} Zeichen`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Muss genau {n} sein` : `Mindestens {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Mindestens {n} Element(e)`;
    }
    return `Wert ist zu klein`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Muss genau {n} Zeichen sein` : `Maximal {n} Zeichen`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Muss genau {n} sein` : `Maximal {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Maximal {n} Element(e)`;
    }
    return `Wert ist zu groß`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Sieht nicht nach gültiger E-Mail aus`;
    if (i.validation === "url") return `Sieht nicht nach gültiger URL aus`;
    if (i.validation === "uuid") return `Keine gültige UUID`;
    if (i.validation === "regex") return `Format passt nicht`;
    if (i.validation === "alpha") return `Nur Buchstaben (a-z, A-Z)`;
    if (i.validation === "numeric") return `Nur Ziffern (0-9)`;
    if (i.validation === "symbol") return `Nur Symbole, keine Buchstaben oder Ziffern`;
    if (i.validation === "phone") return `Sieht nicht nach gültiger Telefonnummer aus`;
    return `Ungültiges Format`;
  },
  invalid_number: () => `Bitte eine gültige Zahl eingeben`,
  invalid_date: () => `Bitte ein gültiges Datum eingeben`,
  invalid_array: () => `Eine Liste wäre erwartet`,
  invalid_union: () => `Kein Format hat gepasst`,
  invalid_intersection: () => `Nicht alle Anforderungen erfüllt`,
  invalid_discriminator: (i) => `Unbekannter Typ "{disc}". Erwartet: {allowed}`,
  unknown_keys: (i) => `Unerwartete(s) Feld(er): {keys}`,
  invalid_tuple_length: (i) => `Erwartet {min} Element(e), {max} bekommen`,
  custom: () => `Wert ist nicht gültig`,
};
