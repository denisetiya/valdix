import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const FR: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} est requis`,
  invalid_type: (i) => `On attendait {exp}, mais on a reçu {rec}`,
  invalid_literal: (i) => `Doit être {lit}`,
  invalid_enum_value: (i) => `Doit être l'un de : {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Doit faire exactement {n} caractères` : `Il faut au moins {n} caractères`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Doit être exactement {n}` : `Doit être au moins {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Il faut au moins {n} élément(s)`;
    }
    return `Valeur trop petite`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Doit faire exactement {n} caractères` : `Pas plus de {n} caractères`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Doit être exactement {n}` : `Ne doit pas dépasser {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Pas plus de {n} élément(s)`;
    }
    return `Valeur trop grande`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Cet email n'a pas l'air valide`;
    if (i.validation === "url") return `Cette URL n'a pas l'air valide`;
    if (i.validation === "uuid") return `Cet UUID n'est pas valide`;
    if (i.validation === "regex") return `Le format n'est pas bon`;
    if (i.validation === "alpha") return `Lettres uniquement (a-z, A-Z)`;
    if (i.validation === "numeric") return `Chiffres uniquement (0-9)`;
    if (i.validation === "symbol") return `Symboles uniquement, pas de lettres ni de chiffres`;
    if (i.validation === "phone") return `Ce numéro de téléphone n'est pas valide`;
    return `Format invalide`;
  },
  invalid_number: () => `Merci de saisir un nombre valide`,
  invalid_date: () => `Merci de saisir une date valide`,
  invalid_array: () => `On attendait une liste`,
  invalid_union: () => `Aucune correspondance trouvée`,
  invalid_intersection: () => `Toutes les conditions ne sont pas remplies`,
  invalid_discriminator: (i) => `Type "{disc}" inconnu. Attendu : {allowed}`,
  unknown_keys: (i) => `Champ(s) inattendu(s) : {keys}`,
  invalid_tuple_length: (i) => `Attendu {min} élément(s), reçu {max}`,
  custom: () => `Cette valeur n'est pas valide`,
};
