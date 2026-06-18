// Basic example — user signup form validation
import v from "../dist/index.js";

const SignupSchema = v.object({
  username: v.string()
    .min(3, "Username minimal 3 karakter ya")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username cuma boleh huruf, angka, underscore"),
  email: v.string()
    .email("Format email-nya gak valid"),
  password: v.string()
    .min(8, "Password minimal 8 karakter")
    .superRefine((val, ctx) => {
      if (!/[A-Z]/.test(val)) ctx.addIssue({ code: "custom", message: "Butuh minimal 1 huruf besar" });
      if (!/[0-9]/.test(val)) ctx.addIssue({ code: "custom", message: "Butuh minimal 1 angka" });
    }),
  age: v.number().int().min(13, "Minimal umur 13 tahun"),
  role: v.enum(["user", "admin"]).default("user"),
  newsletter: v.boolean().default(false),
});

// Password is ≥ 8 chars so superRefine runs and accumulates multi-issues
const form = {
  username: "ab",
  email: "not-an-email",
  password: "allowercase",     // ≥ 8 but no uppercase, no digit
  age: 10,
};

v.useLang("id");
const r = SignupSchema.safeParse(form);
if (!r.success) {
  console.log("Validation failed:");
  for (const e of r.errors) {
    console.log(`  - [${e.code}] ${e.field ?? e.path.join(".")}: ${e.message}`);
  }
}

// → Validation failed:
//   - [too_small] username: Username minimal 3 karakter ya
//   - [invalid_string] email: Format email-nya gak valid
//   - [custom] password: Butuh minimal 1 huruf besar
//   - [custom] password: Butuh minimal 1 angka
//   - [too_small] age: Minimal umur 13 tahun
