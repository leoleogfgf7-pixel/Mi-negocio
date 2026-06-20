import ProductoForm from "@/components/ProductoForm";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const cats = await db.select().from(categorias).orderBy(asc(categorias.nombre));
  return <ProductoForm categorias={cats} />;
}