// Recursive type example — tree structure (TypeScript)
import v, { type Infer } from "valdix";

type Category = {
  name: string;
  children?: Category[];
};

const CategorySchema: v.Schema<Category, Category> = v.lazy(() =>
  v.object({
    name: v.string().min(1),
    children: v.array(CategorySchema).optional(),
  })
);

type _Inferred = Infer<typeof CategorySchema>;
// → { name: string; children?: (Category)[] | undefined }
