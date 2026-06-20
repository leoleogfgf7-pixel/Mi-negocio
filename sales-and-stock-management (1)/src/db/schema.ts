import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  date,
} from "drizzle-orm/pg-core";

// ============== CATEGORIAS ==============
export const categorias = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  color: text("color").default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============== PRODUCTOS (STOCK) ==============
export const productos = pgTable("productos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  sku: text("sku"),
  categoriaId: integer("categoria_id").references(() => categorias.id, {
    onDelete: "set null",
  }),
  precioCompra: numeric("precio_compra", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  precioVenta: numeric("precio_venta", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  precioMayor: numeric("precio_mayor", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  stockActual: integer("stock_actual").notNull().default(0),
  stockMinimo: integer("stock_minimo").notNull().default(5),
  unidad: text("unidad").notNull().default("unidad"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============== CLIENTES ==============
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email"),
  telefono: text("telefono"),
  direccion: text("direccion"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============== VENTAS (cabecera) ==============
export const ventas = pgTable("ventas", {
  id: serial("id").primaryKey(),
  fecha: timestamp("fecha").defaultNow().notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id, {
    onDelete: "set null",
  }),
  clienteNombre: text("cliente_nombre").notNull().default("Consumidor final"),
  estado: text("estado").notNull().default("completada"), // completada, pendiente, cancelada
  tipoVenta: text("tipo_venta").notNull().default("menor"), // mayor o menor
  metodoPago: text("metodo_pago").notNull().default("efectivo"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  descuento: numeric("descuento", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  costoTotal: numeric("costo_total", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  ganancia: numeric("ganancia", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============== ITEMS DE VENTA ==============
export const ventaItems = pgTable("venta_items", {
  id: serial("id").primaryKey(),
  ventaId: integer("venta_id")
    .notNull()
    .references(() => ventas.id, { onDelete: "cascade" }),
  productoId: integer("producto_id")
    .notNull()
    .references(() => productos.id, { onDelete: "restrict" }),
  productoNombre: text("producto_nombre").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: numeric("precio_unitario", { precision: 12, scale: 2 })
    .notNull(),
  costoUnitario: numeric("costo_unitario", { precision: 12, scale: 2 })
    .notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// ============== MOVIMIENTOS DE STOCK ==============
export const movimientosStock = pgTable("movimientos_stock", {
  id: serial("id").primaryKey(),
  fecha: timestamp("fecha").defaultNow().notNull(),
  productoId: integer("producto_id")
    .notNull()
    .references(() => productos.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // entrada, salida, ajuste
  cantidad: integer("cantidad").notNull(),
  stockAnterior: integer("stock_anterior").notNull(),
  stockNuevo: integer("stock_nuevo").notNull(),
  motivo: text("motivo"),
  referencia: text("referencia"), // ej: "Venta #5"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============== GASTOS ==============
export const gastos = pgTable("gastos", {
  id: serial("id").primaryKey(),
  fecha: date("fecha").notNull(),
  categoria: text("categoria").notNull().default("general"),
  descripcion: text("descripcion").notNull(),
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============== USUARIOS ==============
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("vendedor"), // admin, vendedor
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Categoria = typeof categorias.$inferSelect;
export type Producto = typeof productos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Venta = typeof ventas.$inferSelect;
export type VentaItem = typeof ventaItems.$inferSelect;
export type MovimientoStock = typeof movimientosStock.$inferSelect;
export type Gasto = typeof gastos.$inferSelect;