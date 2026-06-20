import { db } from "@/db";
import { productos, categorias, clientes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import NuevaVentaClient from "@/components/NuevaVentaClient";

export const dynamic = "force-dynamic";

type Search = Promise<{ tipo?: string }>;

export default async function NuevaVentaPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { tipo } = await searchParams;
  const [prods, cats, cls] = await Promise.all([
    db
      .select()
      .from(productos)
      .where(eq(productos.activo, true))
      .orderBy(asc(productos.nombre)),
    db.select().from(categorias),
    db.select().from(clientes).orderBy(asc(clientes.nombre)),
  ]);
  return (
    <NuevaVentaClient
      productos={prods}
      categorias={cats}
      clientes={cls}
      tipoInicial={tipo === "mayor" ? "mayor" : "menor"}
    />
  );
}