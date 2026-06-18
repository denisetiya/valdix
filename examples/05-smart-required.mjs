// v0.4.0 features: alpha, numeric, symbol, phone + smart required
import v from "../dist/index.js";

// 1. Smart "required" behavior — empty / null / undefined → custom required message,
//    non-empty but failing other rules → that rule's message.
const userSchema = v.object({
  name: v.string()
    .required("Name tidak boleh kosong")
    .min(3, "Minimal 3 karakter")
    .max(20, "Maksimal 20 karakter")
    .alpha("Name hanya boleh huruf"),
  age: v.string()
    .required("Umur tidak boleh kosong")
    .numeric("Umur hanya boleh angka"),
  phone: v.string()
    .required("Nomor HP tidak boleh kosong")
    .phone("Format nomor HP tidak valid"),
});

// Case A: user submits empty
console.log("=== empty fields ===");
console.log(userSchema.safeParse({ name: "", age: "", phone: "" }));
// → Name tidak boleh kosong, Umur tidak boleh kosong, Nomor HP tidak boleh kosong

// Case B: user submits "hu" (too short) and "12a" (not numeric) and "abc" (not phone)
console.log("\n=== wrong format ===");
console.log(userSchema.safeParse({ name: "hu", age: "12a", phone: "abc" }));
// → Minimal 3 karakter, Umur hanya boleh angka, Format nomor HP tidak valid

// 2. New string validators
console.log("\n=== alpha / numeric / symbol / phone ===");
console.log("alpha('hello'):", v.string().alpha().safeParse("hello").success);  // true
console.log("alpha('hi123'):", v.string().alpha().safeParse("hi123").success);  // false
console.log("numeric('12345'):", v.string().numeric().safeParse("12345").success);  // true
console.log("symbol('!@#$'):", v.string().symbol().safeParse("!@#$").success);  // true
console.log("phone('+62 812-3456-7890'):", v.string().phone().safeParse("+62 812-3456-7890").success);  // true

// 3. Optional allows empty
console.log("\n=== optional with min ===");
const opt = v.string().min(3, "Min 3").optional();
console.log("optional().parse(''):", opt.safeParse("")); // { success: true }
console.log("optional().parse(undefined):", opt.safeParse(undefined)); // { success: true }
console.log("optional().parse('ab'):", opt.safeParse("ab")); // { success: false, errors: [{ Min 3 }] }

// 4. Intersection of 3+ schemas
console.log("\n=== intersection of 3 schemas ===");
const withTimestamps = v.object({ createdAt: v.string() });
const withAuthor = v.object({ author: v.string() });
const withBody = v.object({ body: v.string() });
const Post = v.intersection(withTimestamps, withAuthor, withBody);
const result = Post.safeParse({
  createdAt: "2026-01-01",
  author: "deni",
  body: "hello",
});
console.log("result:", result);
// → { success: true, data: { createdAt, author, body } }
