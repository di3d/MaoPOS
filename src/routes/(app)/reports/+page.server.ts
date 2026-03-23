import { db } from '$lib/server/db';
import { sales, saleItems, settings } from '$lib/server/schema';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	// Today's sales
	const today = db
		.select({
			total: sql<number>`coalesce(sum(${sales.totalAmount}), 0)`,
			count: sql<number>`count(*)`
		})
		.from(sales)
		.where(sql`date(${sales.createdAt}) = date('now')`)
		.get();

	// This week's sales (Monday-based week)
	const week = db
		.select({
			total: sql<number>`coalesce(sum(${sales.totalAmount}), 0)`,
			count: sql<number>`count(*)`
		})
		.from(sales)
		.where(sql`date(${sales.createdAt}) >= date('now', 'weekday 0', '-6 days')`)
		.get();

	// This month's sales
	const month = db
		.select({
			total: sql<number>`coalesce(sum(${sales.totalAmount}), 0)`,
			count: sql<number>`count(*)`
		})
		.from(sales)
		.where(sql`strftime('%Y-%m', ${sales.createdAt}) = strftime('%Y-%m', 'now')`)
		.get();

	// Top 10 products by quantity sold
	const topProducts = db
		.select({
			name: saleItems.productName,
			sku: saleItems.productSku,
			totalQty: sql<number>`sum(${saleItems.quantity})`,
			totalRevenue: sql<number>`sum(${saleItems.lineTotal})`
		})
		.from(saleItems)
		.groupBy(saleItems.productName, saleItems.productSku)
		.orderBy(sql`sum(${saleItems.quantity}) desc`)
		.limit(10)
		.all();

	// Daily sales for last 30 days
	const dailySales = db
		.select({
			date: sql<string>`date(${sales.createdAt})`,
			count: sql<number>`count(*)`,
			total: sql<number>`coalesce(sum(${sales.totalAmount}), 0)`
		})
		.from(sales)
		.where(sql`date(${sales.createdAt}) >= date('now', '-30 days')`)
		.groupBy(sql`date(${sales.createdAt})`)
		.orderBy(sql`date(${sales.createdAt}) desc`)
		.all();

	// Profit: revenue vs cost
	const profitData = db
		.select({
			totalRevenue: sql<number>`coalesce(sum(${saleItems.lineTotal}), 0)`,
			totalCost: sql<number>`coalesce(sum(${saleItems.unitCost} * ${saleItems.quantity}), 0)`
		})
		.from(saleItems)
		.get();

	const totalRevenue = profitData?.totalRevenue ?? 0;
	const totalCost = profitData?.totalCost ?? 0;

	return {
		today: {
			total: today?.total ?? 0,
			count: today?.count ?? 0
		},
		week: {
			total: week?.total ?? 0,
			count: week?.count ?? 0
		},
		month: {
			total: month?.total ?? 0,
			count: month?.count ?? 0
		},
		topProducts,
		dailySales,
		profit: {
			totalRevenue,
			totalCost,
			grossProfit: totalRevenue - totalCost
		},
		currencySymbol: appSettings?.currencySymbol ?? '$'
	};
};
