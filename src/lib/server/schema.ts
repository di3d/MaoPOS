import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ─── Settings ────────────────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey().default(1),
	shopName: text('shop_name').notNull().default('MaoPOS'),
	shopAddress: text('shop_address'),
	shopPhone: text('shop_phone'),
	shopEmail: text('shop_email'),
	currency: text('currency').notNull().default('USD'),
	currencySymbol: text('currency_symbol').notNull().default('$'),
	taxRate: real('tax_rate').notNull().default(0),
	receiptFooter: text('receipt_footer'),
	operatorName: text('operator_name').notNull().default('Admin')
});

// ─── Categories ──────────────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	isComponent: integer('is_component', { mode: 'boolean' }).notNull().default(false),
	sortOrder: integer('sort_order').notNull().default(0)
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = sqliteTable('products', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sku: text('sku').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	categoryId: integer('category_id').references(() => categories.id),
	costPrice: real('cost_price').notNull().default(0),
	sellPrice: real('sell_price').notNull().default(0),
	stockQty: integer('stock_qty').notNull().default(0),
	lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = sqliteTable('customers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').unique(),
	phone: text('phone'),
	address: text('address'),
	notes: text('notes'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Sales ────────────────────────────────────────────────────────────────────
export const sales = sqliteTable('sales', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	invoiceNumber: text('invoice_number').notNull().unique(),
	customerId: integer('customer_id').references(() => customers.id),
	subtotal: real('subtotal').notNull().default(0),
	discountAmount: real('discount_amount').notNull().default(0),
	taxAmount: real('tax_amount').notNull().default(0),
	totalAmount: real('total_amount').notNull().default(0),
	paymentMethod: text('payment_method').notNull().default('cash'),
	amountTendered: real('amount_tendered'),
	changeGiven: real('change_given'),
	notes: text('notes'),
	status: text('status').notNull().default('completed'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	createdBy: text('created_by').notNull().default('Admin')
});

// ─── Sale Items ───────────────────────────────────────────────────────────────
export const saleItems = sqliteTable('sale_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	saleId: integer('sale_id')
		.notNull()
		.references(() => sales.id),
	productId: integer('product_id').references(() => products.id),
	productName: text('product_name').notNull(),
	productSku: text('product_sku').notNull(),
	unitPrice: real('unit_price').notNull(),
	unitCost: real('unit_cost').notNull().default(0),
	quantity: integer('quantity').notNull().default(1),
	discountPct: real('discount_pct').notNull().default(0),
	lineTotal: real('line_total').notNull()
});

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotations = sqliteTable('quotations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	quoteNumber: text('quote_number').notNull().unique(),
	customerId: integer('customer_id').references(() => customers.id),
	title: text('title'),
	subtotal: real('subtotal').notNull().default(0),
	discountAmount: real('discount_amount').notNull().default(0),
	taxAmount: real('tax_amount').notNull().default(0),
	totalAmount: real('total_amount').notNull().default(0),
	notes: text('notes'),
	validUntil: text('valid_until'),
	status: text('status').notNull().default('draft'),
	convertedToSaleId: integer('converted_to_sale_id').references(() => sales.id),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Quotation Items ──────────────────────────────────────────────────────────
export const quotationItems = sqliteTable('quotation_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	quotationId: integer('quotation_id')
		.notNull()
		.references(() => quotations.id),
	productId: integer('product_id').references(() => products.id),
	productName: text('product_name').notNull(),
	productSku: text('product_sku').notNull(),
	unitPrice: real('unit_price').notNull(),
	quantity: integer('quantity').notNull().default(1),
	discountPct: real('discount_pct').notNull().default(0),
	lineTotal: real('line_total').notNull()
});

// ─── PC Builds ────────────────────────────────────────────────────────────────
export const pcBuilds = sqliteTable('pc_builds', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	customerId: integer('customer_id').references(() => customers.id),
	totalCost: real('total_cost').notNull().default(0),
	totalSell: real('total_sell').notNull().default(0),
	notes: text('notes'),
	status: text('status').notNull().default('draft'),
	quotationId: integer('quotation_id').references(() => quotations.id),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── PC Build Items ───────────────────────────────────────────────────────────
export const pcBuildItems = sqliteTable('pc_build_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	buildId: integer('build_id')
		.notNull()
		.references(() => pcBuilds.id),
	productId: integer('product_id')
		.notNull()
		.references(() => products.id),
	categoryId: integer('category_id').references(() => categories.id),
	quantity: integer('quantity').notNull().default(1),
	unitPrice: real('unit_price').notNull(),
	unitCost: real('unit_cost').notNull().default(0)
});

// ─── Stock Takes ──────────────────────────────────────────────────────────────
export const stockTakes = sqliteTable('stock_takes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	notes: text('notes'),
	status: text('status').notNull().default('in_progress'),
	startedAt: text('started_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	completedAt: text('completed_at')
});

// ─── Stock Take Items ─────────────────────────────────────────────────────────
export const stockTakeItems = sqliteTable('stock_take_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	stockTakeId: integer('stock_take_id')
		.notNull()
		.references(() => stockTakes.id),
	productId: integer('product_id')
		.notNull()
		.references(() => products.id),
	systemQty: integer('system_qty').notNull(),
	countedQty: integer('counted_qty'),
	notes: text('notes')
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type Settings = typeof settings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type PcBuild = typeof pcBuilds.$inferSelect;
export type PcBuildItem = typeof pcBuildItems.$inferSelect;
export type StockTake = typeof stockTakes.$inferSelect;
export type StockTakeItem = typeof stockTakeItems.$inferSelect;
