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
    if (i.validation === "e164") return "Pakai format internasional, contoh +6281234567890";
    if (i.validation === "jwt") return "Format token tidak valid";
    if (i.validation === "mac") return "Format MAC address tidak valid";
    if (i.validation === "semver") return "Pakai format versi seperti 1.2.3";
    if (i.validation === "creditCard") return "Nomor kartu tidak valid";
    if (i.validation === "imei") return "IMEI harus 15 digit";
    if (i.validation === "hash") return "Format hash tidak valid";
    if (i.validation === "hex") return "Hanya boleh hex (0-9, a-f)";
    if (i.validation === "base64url") return "Format base64url tidak valid";
    if (i.validation === "lowercase") return "Harus huruf kecil semua";
    if (i.validation === "uppercase") return "Harus huruf besar semua";
    if (i.validation === "normalized") return "Teks harus ternormalisasi (NFC)";
    return "Format tidak valid";
  },
  invalid_number: (i) => {
    if (i.validation === "nan") return "Harus NaN";
    if (i.validation === "step") return "Angka harus kelipatan yang pas";
    if (i.validation === "multiple") return "Angka harus kelipatan";
    return "Masukkan angka yang valid";
  },
  invalid_date: () => "Masukkan tanggal yang valid",
  invalid_array: () => "Harus berupa daftar item",
  invalid_union: () => "Nilai tidak cocok dengan format mana pun",
  invalid_intersection: () => "Nilai tidak memenuhi semua persyaratan",
  invalid_discriminator: (i) => `Tipe "${i.discriminator}" tidak dikenal. Pilihan: ${(i.allowedDiscriminators ?? []).join(", ")}`,
  unknown_keys: (i) => `Field tidak dikenal: ${(i.keys ?? []).join(", ")}`,
  invalid_tuple_length: (i) => `Seharusnya ${i.minimum ?? "?"} item, menerima ${i.maximum ?? "?"}`,
  custom: () => "Nilai ini tidak valid",
};
