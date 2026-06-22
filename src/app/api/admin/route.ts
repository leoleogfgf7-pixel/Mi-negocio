import { db } from "@/db";
import { ventas, ventaItems, movimientos, gastos, productos, clientes, categorias } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql, and, gte, lt, eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const action = b.action as string;

    if (action === "reset_all") {
      // Delete everything in order (foreign key safe)
      await db.delete(ventaItems);
      await db.delete(ventas);
      await db.delete(movimientos);
      await db.delete(gastos);
      await db.delete(productos);
      await db.delete(clientes);
      await db.delete(categorias);

      // Reset sequences
      await db.execute(sql`
        ALTER SEQUENCE IF EXISTS categorias_id_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS productos_id_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS clientes_id_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS ventas_id_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS venta_items_id_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS movimientos_id_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS gastos_id_seq RESTART WITH 1;
      `);

      return NextResponse.json({ ok: true, message: "Todo reiniciado" });
    }

    if (action === "delete_ventas_mes") {
      // Delete sales from a specific month (or current month)
      const year = Number(b.year || new Date().getFullYear());
      const month = Number(b.month || new Date().getMonth() + 1);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      // Get ventas of that month
      const ventasMes = await db.select().from(ventas)
        .where(and(gte(ventas.createdAt, start), lt(ventas.createdAt, end)));

      const ventaIds = ventasMes.map(v => v.id);

      // Restore stock for completed sales
      for (const v of ventasMes) {
        if (v.estado === "completada") {
          const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, v.id));
          for (const it of items) {
            await db.update(productos).set({
              stock: sql`${productos.stock} + ${it.cantidad}`,
            }).where(eq(productos.id, it.productoId));
          }
        }
      }

      // Delete items and ventas of that month
      if (ventaIds.length > 0) {
        await db.delete(ventaItems).where(sql`${ventaItems.ventaId} = ANY(${ventaIds})`);
        await db.delete(ventas).where(and(gte(ventas.createdAt, start), lt(ventas.createdAt, end)));
      }

      // Also delete movimientos and gastos of that month
      await db.delete(movimientos).where(and(gte(movimientos.createdAt, start), lt(movimientos.createdAt, end)));
      await db.delete(gastos).where(and(gte(gastos.createdAt, start), lt(gastos.createdAt, end)));

      return NextResponse.json({ ok: true, message: `Se eliminaron ${ventaIds.length} ventas del mes ${month}/${year}` });
    }

    if (action === "delete_all_ventas") {
      // Restore stock for all completed sales
      const completadas = await db.select().from(ventas).where(eq(ventas.estado, "completada"));
      for (const v of completadas) {
        const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, v.id));
        for (const it of items) {
          await db.update(productos).set({
            stock: sql`${productos.stock} + ${it.cantidad}`,
          }).where(eq(productos.id, it.productoId));
        }
      }

      await db.delete(ventaItems);
      await db.delete(ventas);
      await db.delete(movimientos);

      return NextResponse.json({ ok: true, message: "Todas las ventas y movimientos eliminados" });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (e) {
    console.error("Admin action error:", e);
    return NextResponse.json({ error: "Error: " + String(e) }, { status: 500 });
  }
}
