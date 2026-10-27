import { redirect } from "next/navigation";

/* No dashboard in this version: products is the admin home. The layout checks the role first. */
export default function AdminPage() {
  redirect("/admin/products");
}
