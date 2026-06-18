// Form validation with locale switching
import v from "../dist/index.js";

const ContactSchema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
  message: v.string().min(10).max(1000),
});

const input = { name: "D", email: "bad", message: "hi" };

// English
v.useLang("en");
let r = ContactSchema.safeParse(input);
console.log("EN errors:");
for (const e of r.errors) console.log(`  ${e.field}: ${e.message}`);

// Japanese
v.useLang("jp");
r = ContactSchema.safeParse(input);
console.log("\nJP errors:");
for (const e of r.errors) console.log(`  ${e.field}: ${e.message}`);

// Indonesian
v.useLang("id");
r = ContactSchema.safeParse(input);
console.log("\nID errors:");
for (const e of r.errors) console.log(`  ${e.field}: ${e.message}`);
