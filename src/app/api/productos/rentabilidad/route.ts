import { db } from "@/db";
import { productos, categorias, ventaItems, ventas } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const emptyResult = { productos: [], totals: { totalProductos: 0, totalUnidadesVendidas: 0, totalIngresosVentas: 0, totalCostoVentas: 0, totalGananciaGenerada: 0, totalStockActual: 0, totalInversionStock: 0, totalIngresosPotenciales: 0, totalGananciaPotencial: 0, totalProyectado: 0 } };

export async function GET() {
  try {
    const prods = await db
      .select({
        id: productos.id, nombre: productos.nombre, sku: productos.sku,
        precioCosto: productos.precioCosto, precioVenta: productos.precioVenta,
        precioEspecial: productos.precioEspecial, stock: productos.stock,
        unidad: productos.unidad, categoriaNombre: categorias.nombre,
        categoriaColor: categorias.color,
      })
      .from(productos)
      .leftJoin(categorias, eq(productos.categoriaId, categorias.id))
      .where(eq(productos.activo, true))
      .orderBy(productos.nombre);

    const ventasData = await db
      .select({
        productoId: ventaItems.productoId,
        unidadesVendidas: sql<number>`coalesce(sum(${ventaItems.cantidad}), 0)::int`,
        ingresosVentas: sql<string>`coalesce(sum(${ventaItems.subtotal}::numeric), 0)::text`,
        costoVentas: sql<string>`coalesce(sum(${ventaItems.precioCosto}::numeric * ${ventaItems.cantidad}), 0)::text`,
      })
      .from(ventaItems)
      .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
      .where(eq(ventas.estado, "completada"))
      .groupBy(ventaItems.productoId);

    const ventasMap = new Map(ventasData.map((v) => [v.productoId, v]));

    const result = prods.map((p) => {
      const vData = ventasMap.get(p.id);
      const costo = Number(p.precioCosto ?? 0);
      const venta = Number(p.precioVenta ?? 0);
      const especial = p.precioEspecial ? Number(p.precioEspecial) : null;
      const stock = p.stock ?? 0;
      const margenUnidad = venta - costo;
      const margenEspecial = especial !== null ? especial - costo : null;
      const unidadesVendidas = vData?.unidadesVendidas ?? 0;
      const ingresosVentas = Number(vData?.ingresosVentas ?? 0);
      const costoVentas = Number(vData?.costoVentas ?? 0);
      const gananciaGenerada = ingresosVentas - costoVentas;
      const gananciaPotencial = margenUnidad * stock;
      const gananciaPotencialEspecial = margenEspecial !== null ? margenEspecial * stock : null;
      const inversionStock = costo * stock;
      const ingresosPotenciales = venta * stock;
      const roi = costoVentas > 0 ? ((gananciaGenerada / costoVentas) * 100) : 0;

      return {
        id: p.id, nombre: p.nombre, sku: p.sku,
        categoriaNombre: p.categoriaNombre, categoriaColor: p.categoriaColor,
        unidad: p.unidad, precioCosto: costo, precioVenta: venta,
        precioEspecial: especial, stock, margenUnidad, margenEspecial,
        unidadesVendidas, ingresosVentas, costoVentas, gananciaGenerada,
        gananciaPotencial, gananciaPotencialEspecial, inversionStock,
        ingresosPotenciales, roi,
      };
    });

    const totals = {
      totalProductos: result.length,
      totalUnidadesVendidas: result.reduce((s, r) => s + r.unidadesVendidas, 0),
      totalIngresosVentas: result.reduce((s, r) => s + r.ingresosVentas, 0),
      totalCostoVentas: result.reduce((s, r) => s + r.costoVentas, 0),
      totalGananciaGenerada: result.reduce((s, r) => s + r.gananciaGenerada, 0),
      totalStockActual: result.reduce((s, r) => s + r.stock, 0),
      totalInversionStock: result.reduce((s, r) => s + r.inversionStock, 0),
      totalIngresosPotenciales: result.reduce((s, r) => s + r.ingresosPotenciales, 0),
      totalGananciaPotencial: result.reduce((s, r) => s + r.gananciaPotencial, 0),
      totalProyectado: result.reduce((s, r) => s + r.gananciaGenerada + r.gananciaPotencial, 0),
    };

    return NextResponse.json({ productos: result, totals });
  } catch (e) {
    console.error("Rentabilidad API error:", e);
    return NextResponse.json(emptyResult);
  }
}
