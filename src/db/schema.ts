import { pgTable, serial, text, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const categorias = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  color: text("color").default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productos = pgTable("productos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  sku: text("sku"),
  descripcion: text("descripcion"),
  categoriaId: integer("categoria_id"),
  precioCosto: numeric("precio_costo", { precision: 12, scale: 2 }).default("0"),
  precioVenta: numeric("precio_venta", { precision: 12, scale: 2 }).default("0"),
  precioEspecial: numeric("precio_especial", { precision: 12, scale: 2 }),
  stock: integer("stock").default(0),
  stockMinimo: integer("stock_minimo").default(5),
  unidad: text("unidad").default("unidad"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email"),
  telefono: text("telefono"),
  direccion: text("direccion"),
  ruc: text("ruc"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ventas = pgTable("ventas", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id"),
  clienteNombre: text("cliente_nombre"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0"),
  descuento: numeric("descuento", { precision: 12, scale: 2 }).default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).default("0"),
  costo: numeric("costo", { precision: 12, scale: 2 }).default("0"),
  metodoPago: text("metodo_pago").default("efectivo"),
  estado: text("estado").default("completada"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ventaItems = pgTable("venta_items", {
  id: serial("id").primaryKey(),
  ventaId: integer("venta_id").notNull(),
  productoId: integer("producto_id").notNull(),
  productoNombre: text("producto_nombre").notNull(),
  cantidad: integer("cantidad").default(1),
  precioUnitario: numeric("precio_unitario", { precision: 12, scale: 2 }).default("0"),
  precioCosto: numeric("precio_costo", { precision: 12, scale: 2 }).default("0"),
  usoPrecioEspecial: boolean("uso_precio_especial").default(false),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0"),
});

export const movimientos = pgTable("movimientos", {
  id: serial("id").primaryKey(),
  productoId: integer("producto_id").notNull(),
  productoNombre: text("producto_nombre"),
  tipo: text("tipo").notNull(), // entrada, salida, ajuste
  cantidad: integer("cantidad").notNull(),
  motivo: text("motivo"),
  referencia: text("referencia"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gastos = pgTable("gastos", {
  id: serial("id").primaryKey(),
  concepto: text("concepto").notNull(),
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  categoria: text("categoria").default("otros"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});
