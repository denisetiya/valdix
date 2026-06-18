import type { LocaleCatalog } from "../core/types.js";

const humanize = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export const ID: LocaleCatalog = {
  required: (i) => `${i.field ? humanize(i.field) : "Bagian ini"} tidak boleh kosong`,
  invalid_type: (i) => `Seharusnya ${i.expected ?? "nilai yang valid"}, tapi menerima ${i.received ?? "tidak dikenal"}`,
  invalid_literal: (i) => `Seharusnya literal ${String(i.literal)}`,
  invalid_enum_value: (i) => `Pilih salah satu dari: ${(i.options ?? []).map(String).join(", ")}`,
  too_small: (i) => {
    if (i.kind === "string" && typeof i.minimum === "number") {
      return i.exact
        ? `Panjangnya harus tepat ${i.minimum} karakter`
        : `Minimal ${i.minimum} karakter`;
    }
    if (i.kind === "number" && typeof i.minimum === "number") {
      return i.exact
        ? `Nilainya harus tepat ${i.minimum}`
        : `Minimal ${i.minimum}`;
    }
    if (i.kind === "array" && typeof i.minimum === "number") {
      return `Minimal ${i.minimum} item`;
    }
    return "Nilai terlalu kecil";
  },
  too_big: (i) => {
    if (i.kind === "string" && typeof i.maximum === "number") {
      return i.exact
        ? `Panjangnya harus tepat ${i.maximum} karakter`
        : `Maksimal ${i.maximum} karakter`;
    }
    if (i.kind === "number" && typeof i.maximum === "number") {
      return i.exact
        ? `Nilainya harus tepat ${i.maximum}`
        : `Maksimal ${i.maximum}`;
    }
    if (i.kind === "array" && typeof i.maximum === "number") {
      return `Maksimal ${i.maximum} item`;
    }
    return "Nilai terlalu besar";
  },
  invalid_string: (i) => {
    if (i.validation === "email") return "Alamat email tidak valid";
    if (i.validation === "url") return "Alamat URL tidak valid";
    if (i.validation === "uuid") return "Format UUID tidak valid";
    if (i.validation === "regex") return "Formatnya tidak sesuai";
    if (i.validation === "alpha") return "Hanya boleh huruf (a-z, A-Z)";
    if (i.validation === "numeric") return "Hanya boleh angka (0-9)";
    if (i.validation === "symbol") return "Hanya boleh simbol, tanpa huruf/angka";
    if (i.validation === "phone") return "Nomor HP tidak valid";
    return "Format tidak valid";
  },
  invalid_number: () => "Masukkan angka yang valid",
  invalid_date: () => "Masukkan tanggal yang valid",
  invalid_array: () => "Harus berupa daftar item",
  invalid_union: () => "Nilai tidak cocok dengan format mana pun",
  invalid_intersection: () => "Nilai tidak memenuhi semua persyaratan",
  invalid_discriminator: (i) => `Tipe "${i.discriminator}" tidak dikenal. Pilihan: ${(i.allowedDiscriminators ?? []).join(", ")}`,
  unknown_keys: (i) => `Field tidak dikenal: ${(i.keys ?? []).join(", ")}`,
  invalid_tuple_length: (i) => `Seharusnya ${i.minimum ?? "?"} item, menerima ${i.maximum ?? "?"}`,
  custom: () => "Nilai ini tidak valid",
};
