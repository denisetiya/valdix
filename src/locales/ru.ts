import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const RU: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "this field"} обязательно`,
  invalid_type: (i) => `Ожидалось {exp}, но получено {rec}`,
  invalid_literal: (i) => `Должно быть {lit}`,
  invalid_enum_value: (i) => `Должно быть одно из: {opts}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact ? `Должно быть ровно {n} символов` : `Минимум {n} символов`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact ? `Должно быть ровно {n}` : `Минимум {n}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Минимум {n} элемент(ов)`;
    }
    return `Значение слишком маленькое`;
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact ? `Должно быть ровно {n} символов` : `Максимум {n} символов`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact ? `Должно быть ровно {n}` : `Максимум {n}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Максимум {n} элемент(ов)`;
    }
    return `Значение слишком большое`;
  },
  invalid_string: (i) => {
    if (i.validation === "email") return `Похоже, это не email`;
    if (i.validation === "url") return `Похоже, это не URL`;
    if (i.validation === "uuid") return `Это не UUID`;
    if (i.validation === "regex") return `Формат не подходит`;
    if (i.validation === "alpha") return `Только буквы (a-z, A-Z)`;
    if (i.validation === "numeric") return `Только цифры (0-9)`;
    if (i.validation === "symbol") return `Только символы, без букв и цифр`;
    if (i.validation === "phone") return `Похоже, это не номер телефона`;
    return `Неверный формат`;
  },
  invalid_number: () => `Введите число`,
  invalid_date: () => `Введите дату`,
  invalid_array: () => `Ожидался массив`,
  invalid_union: () => `Не подходит ни один формат`,
  invalid_intersection: () => `Не все условия выполнены`,
  invalid_discriminator: (i) => `Неизвестный тип "{disc}". Ожидалось: {allowed}`,
  unknown_keys: (i) => `Неожиданные поля: {keys}`,
  invalid_tuple_length: (i) => `Ожидалось {min} элемент(ов), получено {max}`,
  custom: () => `Это значение не подходит`,
};
