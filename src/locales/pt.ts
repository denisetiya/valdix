import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const PT: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} é obrigatório`,
  invalid_type: (i) => `Era esperado {exp}, mas veio {rec}`,
  invalid_literal: (i) => `Tem que ser {lit}`,
  invalid_enum_value: (i) => `Tem que ser um desses: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Tem que ter exatamente {n} caracteres` : `Precisa de pelo menos {n} caracteres`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Tem que ser exatamente {n}` : `Tem que ser pelo menos {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Precisa de pelo menos {n} item(ns)`;
    }
    return `Valor muito pequeno`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Tem que ter exatamente {n} caracteres` : `No máximo {n} caracteres`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Tem que ser exatamente {n}` : `Não pode passar de {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `No máximo {n} item(ns)`;
    }
    return `Valor muito grande`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Esse email não parece válido`;
    if (i.validation === "url") return `Essa URL não parece válida`;
    if (i.validation === "uuid") return `Esse UUID não é válido`;
    if (i.validation === "regex") return `Formato não confere`;
    if (i.validation === "alpha") return `Só letras (a-z, A-Z)`;
    if (i.validation === "numeric") return `Só números (0-9)`;
    if (i.validation === "symbol") return `Só símbolos, sem letras ou números`;
    if (i.validation === "phone") return `Esse telefone não parece válido`;
    return `Formato inválido`;
  },
  invalid_number: () => `Coloca um número válido aí`,
  invalid_date: () => `Coloca uma data válida aí`,
  invalid_array: () => `Era esperado uma lista`,
  invalid_union: () => `Nenhum formato bateu`,
  invalid_intersection: () => `Faltam requisitos`,
  invalid_discriminator: (i) => `Tipo "{disc}" desconhecido. Esperado: {allowed}`,
  unknown_keys: (i) => `Campo(s) inesperado(s): {keys}`,
  invalid_tuple_length: (i) => `Esperado {min} item(ns), veio {max}`,
  custom: () => `Esse valor não é válido`,
};
