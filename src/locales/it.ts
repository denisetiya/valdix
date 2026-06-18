import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const IT: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} è obbligatorio`,
  invalid_type: (i) => `Ci si aspettava {exp}, ma è arrivato {rec}`,
  invalid_literal: (i) => `Deve essere {lit}`,
  invalid_enum_value: (i) => `Deve essere uno di: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Deve essere esattamente {n} caratteri` : `Almeno {n} caratteri`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Deve essere esattamente {n}` : `Almeno {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Almeno {n} elemento/i`;
    }
    return `Valore troppo piccolo`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Deve essere esattamente {n} caratteri` : `Massimo {n} caratteri`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Deve essere esattamente {n}` : `Massimo {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Massimo {n} elemento/i`;
    }
    return `Valore troppo grande`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Questa email non sembra valida`;
    if (i.validation === "url") return `Questo URL non sembra valido`;
    if (i.validation === "uuid") return `Questo UUID non è valido`;
    if (i.validation === "regex") return `Il formato non va bene`;
    if (i.validation === "alpha") return `Solo lettere (a-z, A-Z)`;
    if (i.validation === "numeric") return `Solo numeri (0-9)`;
    if (i.validation === "symbol") return `Solo simboli, niente lettere o numeri`;
    if (i.validation === "phone") return `Questo numero di telefono non è valido`;
    return `Formato non valido`;
  },
  invalid_number: () => `Inserisci un numero valido`,
  invalid_date: () => `Inserisci una data valida`,
  invalid_array: () => `Ci si aspettava una lista`,
  invalid_union: () => `Nessun formato corrisponde`,
  invalid_intersection: () => `Mancano dei requisiti`,
  invalid_discriminator: (i) => `Tipo "{disc}" sconosciuto. Atteso: {allowed}`,
  unknown_keys: (i) => `Campo/i inatteso/i: {keys}`,
  invalid_tuple_length: (i) => `Attesi {min} elemento/i, ricevuti {max}`,
  custom: () => `Questo valore non è valido`,
};
