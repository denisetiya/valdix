import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const ES: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} es obligatorio`,
  invalid_type: (i) => `Se esperaba {exp}, pero llegó {rec}`,
  invalid_literal: (i) => `Tiene que ser {lit}`,
  invalid_enum_value: (i) => `Tiene que ser uno de: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Tiene que tener exactamente {n} caracteres` : `Mínimo {n} caracteres`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Tiene que ser exactamente {n}` : `Mínimo {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Mínimo {n} elemento(s)`;
    }
    return `Valor muy pequeño`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Tiene que tener exactamente {n} caracteres` : `Máximo {n} caracteres`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Tiene que ser exactamente {n}` : `Máximo {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Máximo {n} elemento(s)`;
    }
    return `Valor muy grande`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Ese email no se ve bien`;
    if (i.validation === "url") return `Esa URL no se ve bien`;
    if (i.validation === "uuid") return `Ese UUID no es válido`;
    if (i.validation === "regex") return `El formato no cuadra`;
    if (i.validation === "alpha") return `Solo letras (a-z, A-Z)`;
    if (i.validation === "numeric") return `Solo números (0-9)`;
    if (i.validation === "symbol") return `Solo símbolos, sin letras ni números`;
    if (i.validation === "phone") return `Ese teléfono no se ve bien`;
    return `Formato inválido`;
  },
  invalid_number: () => `Mete un número válido`,
  invalid_date: () => `Mete una fecha válida`,
  invalid_array: () => `Se esperaba una lista`,
  invalid_union: () => `No coincide con ningún formato`,
  invalid_intersection: () => `Faltan requisitos`,
  invalid_discriminator: (i) => `Tipo "{disc}" desconocido. Esperado: {allowed}`,
  unknown_keys: (i) => `Campo(s) inesperado(s): {keys}`,
  invalid_tuple_length: (i) => `Esperado {min} elemento(s), llegó {max}`,
  custom: () => `Ese valor no es válido`,
};
