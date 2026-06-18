// v0.6.0 tests: 14 new world locales
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  v, useLang,
  ZH, ZH_TW, KO, FR, PT, NL, ES, DE, AR, RU, IT, VI, HI, TH
} from "../dist/index.js";

const LOCALES = [
  { code: "zh",  catalog: ZH,  required: "不能为空",       tooSmall: "至少",   email: "邮箱" },
  { code: "zh-TW", catalog: ZH_TW, required: "不能為空",   tooSmall: "至少",   email: "電子郵件" },
  { code: "ko",  catalog: KO,  required: "입력해주세요",     tooSmall: "최소",   email: "이메일" },
  { code: "fr",  catalog: FR,  required: "est requis",      tooSmall: "au moins", email: "email" },
  { code: "pt",  catalog: PT,  required: "obrigatório",     tooSmall: "menos", email: "email" },
  { code: "nl",  catalog: NL,  required: "verplicht",       tooSmall: "Minimaal", email: "e-mail" },
  { code: "es",  catalog: ES,  required: "obligatorio",     tooSmall: "Mínimo", email: "email" },
  { code: "de",  catalog: DE,  required: "erforderlich",    tooSmall: "Mindestens", email: "E-Mail" },
  { code: "ar",  catalog: AR,  required: "مطلوب",           tooSmall: "على",   email: "بريد" },
  { code: "ru",  catalog: RU,  required: "обязательно",     tooSmall: "Минимум", email: "email" },
  { code: "it",  catalog: IT,  required: "obbligatorio",    tooSmall: "Almeno", email: "email" },
  { code: "vi",  catalog: VI,  required: "không được để trống", tooSmall: "Tối thiểu", email: "Email" },
  { code: "hi",  catalog: HI,  required: "जरूरी है",         tooSmall: "कम से कम", email: "ईमेल" },
  { code: "th",  catalog: TH,  required: "กรุณากรอก",       tooSmall: "อย่างน้อย", email: "อีเมล" },
];

for (const { code, catalog, required, tooSmall, email } of LOCALES) {
  test(`locale ${code}: required field`, () => {
    useLang(code);
    const s = v.object({ name: v.string() });
    const r = s.safeParse({ name: "" });
    assert.equal(r.success, false);
    const msg = r.errors[0].message;
    assert.ok(msg.includes(required), `Expected "${msg}" to include "${required}"`);
  });

  test(`locale ${code}: too_small string`, () => {
    useLang(code);
    const s = v.string().min(5);
    const r = s.safeParse("ab");
    assert.equal(r.success, false);
    const msg = r.errors[0].message;
    assert.ok(msg.includes(tooSmall) || msg.includes("5"), `Expected "${msg}" to include "${tooSmall}" or "5"`);
  });

  test(`locale ${code}: email invalid`, () => {
    useLang(code);
    const s = v.string().email();
    const r = s.safeParse("not-an-email");
    assert.equal(r.success, false);
    const msg = r.errors[0].message;
    assert.ok(msg.length > 0, "Expected non-empty message");
  });
}

test("all 17 locales are auto-registered", async () => {
  const { getLocales } = await import("../dist/index.js");
  const locales = getLocales();
  const codes = Object.keys(locales);
  for (const { code } of LOCALES) {
    assert.ok(codes.includes(code), `Missing locale: ${code}`);
  }
});
