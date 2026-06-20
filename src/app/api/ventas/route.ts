import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  ventas,
  ventaItems,
  productos,
  movimientosStock,
  clientes,
} from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: ventas.id,
      fecha: ventas.fecha,
      clienteId: ventas.clienteId,
      clienteNombre: ventas.clienteNombre,
      estado: ventas.estado,
      tipoVenta: ventas.tipoVenta,
      metodoPago: ventas.metodoPago,
      subtotal: ventas.subtotal,
      descuento: ventas.descuento,
      total: ventas.total,
      costoTotal: ventas.costoTotal,
      ganancia: ventas.ganancia,
      notas: ventas.notas,
    })
    .from(ventas)
    .orderBy(desc(ventas.fecha));

  // Cargar items por venta
  const items = await db.select().from(ventaItems);
  const map = new Map<number, typeof items>();
  for (const it of items) {
    const arr = map.get(it.ventaId) ?? [];
    arr.push(it);
    map.set(it.ventaId, arr);
  }
  return NextResponse.json(
    rows.map((v) => ({ ...v, items: map.get(v.id) ?? [] }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const items = body.items as Array<{
    productoId: number;
    cantidad: number;
  }>;

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "La venta debe tener al menos un producto" },
      { status: 400 }
    );
  }

  // Resolver cliente
  let clienteId: number | null = null;
  let clienteNombre = String(body.clienteNombre || "Consumidor final");
  if (body.clienteId) {
    const [c] = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, Number(body.clienteId)));
    if (c) {
      clienteId = c.id;
      clienteNombre = c.nombre;
    }
  }

  // Calcular totales con precios reales del producto
  let subtotal = 0;
  let costoTotal = 0;
  const itemsConPrecio: Array<{
    productoId: number;
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    costoUnitario: number;
    subtotal: number;
    stockAnterior: number;
  }> = [];

  for (const it of items) {
    const [p] = await db
      .select()
      .from(productos)
      .where(eq(productos.id, Number(it.productoId)));
    if (!p) {
      return NextResponse.json(
        { error: `Producto ${it.productoId} no existe` },
        { status: 400 }
      );
    }
    if (p.stockActual < Number(it.cantidad)) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${p.nombre}"` },
        { status: 400 }
      );
    }
    const cantidad = Number(it.cantidad);
    const precio = parseFloat(p.precioVenta);
    const costo = parseFloat(p.precioCompra);
    subtotal += precio * cantidad;
    costoTotal += costo * cantidad;
    itemsConPrecio.push({
      productoId: p.id,
      productoNombre: p.nombre,
      cantidad,
      precioUnitario: precio,
      costoUnitario: costo,
      subtotal: precio * cantidad,
      stockAnterior: p.stockActual,
    });
  }

  const descuento = Number(body.descuento ?? 0);
  const total = Math.max(0, subtotal - descuento);
  const ganancia = total - costoTotal;

  // Insertar cabecera
  const [venta] = await db
    .insert(ventas)
    .values({
      clienteId,
      clienteNombre,
      estado: body.estado || "completada",
      tipoVenta: body.tipoVenta === "mayor" ? "mayor" : "menor",
      metodoPago: body.metodoPago || "efectivo",
      subtotal: subtotal.toFixed(2),
      descuento: descuento.toFixed(2),
      total: total.toFixed(2),
      costoTotal: costoTotal.toFixed(2),
      ganancia: ganancia.toFixed(2),
      notas: body.notas || null,
    })
    .returning();

  // Insertar items y descontar stock
  for (const it of itemsConPrecio) {
    await db.insert(ventaItems).values({
      ventaId: venta.id,
      productoId: it.productoId,
      productoNombre: it.productoNombre,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario.toFixed(2),
      costoUnitario: it.costoUnitario.toFixed(2),
      subtotal: it.subtotal.toFixed(2),
    });
    const nuevoStock = it.stockAnterior - it.cantidad;
    await db
      .update(productos)
      .set({ stockActual: nuevoStock, updatedAt: new Date() })
      .where(eq(productos.id, it.productoId));
    await db.insert(movimientosStock).values({
      productoId: it.productoId,
      tipo: "salida",
      cantidad: it.cantidad,
      stockAnterior: it.stockAnterior,
      stockNuevo: nuevoStock,
      motivo: "Venta",
      referencia: `Venta #${venta.id}`,
    });
  }

  return NextResponse.json(venta);
}