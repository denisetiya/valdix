// JSON Schema export
import v from "../dist/index.js";

const ProductSchema = v.object({
  id: v.string().uuid().describe("Product unique ID"),
  name: v.string().min(1).max(200).describe("Product display name"),
  price: v.number().positive().multipleOf(0.01).describe("Price in USD"),
  tags: v.array(v.string().min(1)).unique().default([]),
  metadata: v.record(v.string(), v.union([v.string(), v.number(), v.boolean()])).optional(),
  status: v.enum(["draft", "active", "archived"]).default("draft"),
  createdAt: v.date().min(new Date("2024-01-01")),
});

const json = ProductSchema.toJSONSchema();
console.log(JSON.stringify(json, null, 2));

// Output:
// {
//   "type": "object",
//   "properties": {
//     "id": { "type": "string", "format": "uuid", "description": "Product unique ID" },
//     "name": { "type": "string", "minLength": 1, "maxLength": 200, "description": "..." },
//     "price": { "type": "number", "exclusiveMinimum": 0, "description": "..." },
//     "tags": { "type": "array", "items": { "type": "string", "minLength": 1 }, "uniqueItems": true },
//     "metadata": { "type": "object", "additionalProperties": { ... } },
//     "status": { "type": "string", "enum": ["draft", "active", "archived"] },
//     "createdAt": { "type": "string", "format": "date-time", "minimum": "2024-01-01T00:00:00.000Z" }
//   },
//   "required": ["id", "name", "price", "status", "createdAt"]
// }
