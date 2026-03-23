import { db } from '$lib/server/db';
import { products, customers, sales, saleItems, pcBuilds, settings } from '$lib/server/schema';
import { sql, eq, lte, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	const totalProducts = db.select({ count: sql<number>`count(*)` }).from(products).get();
	const totalCustomers = db.select({ count: sql<number>`count(*)` }).from(customers).get();

	// Low stock products
	const lowStockProducts = db
		.select()
		.from(products)
		.where(lte(products.stockQty, products.lowStockThreshold))
		.all();

	// Today's sales
	const todaySales = db
		.select({
			total: sql<number>`coalesce(sum(${sales.totalAmount}), 0)`,
			count: sql<number>`count(*)`
		})
		.from(sales)
		.where(sql`date(${sales.createdAt}) = date('now')`)
		.get();

	// PC Builds count
	const buildCount = db.select({ count: sql<number>`count(*)` }).from(pcBuilds).get();

	// Recent sales with items
	const recentSales = db.select().from(sales).orderBy(desc(sales.createdAt)).limit(10).all();

	return {
		totalProducts: totalProducts?.count ?? 0,
		totalCustomers: totalCustomers?.count ?? 0,
		lowStockCount: lowStockProducts.length,
		lowStockProducts,
		todaySalesTotal: todaySales?.total ?? 0,
		todaySalesCount: todaySales?.count ?? 0,
		buildCount: buildCount?.count ?? 0,
		recentSales,
		currencySymbol: appSettings?.currencySymbol ?? '$'
	};
};
