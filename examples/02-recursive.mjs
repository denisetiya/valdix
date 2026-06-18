// Recursive type example — tree structure (JS only)
// For TypeScript, see examples/02-recursive.ts
import v from "../dist/index.js";

const CategorySchema = v.lazy(() =>
  v.object({
    name: v.string().min(1),
    children: v.array(CategorySchema).optional(),
  })
);

const tree = {
  name: "Root",
  children: [
    { name: "Tech", children: [{ name: "Software" }, { name: "Hardware" }] },
    { name: "News" },
  ],
};

const r = CategorySchema.safeParse(tree);
console.log("valid tree:", r.success);

const badTree = { name: "Root", children: [{ name: 123 }] };
const r2 = CategorySchema.safeParse(badTree);
console.log("invalid tree:", r2.success);
console.log("errors:", JSON.stringify(r2.errors, null, 2));
