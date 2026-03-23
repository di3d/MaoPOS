import { db } from '$lib/server/db';
import { products, settings } from '$lib/server/schema';
import { lte, sql } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	const lowStockCount = db
		.select({ count: sql<number>`count(*)` })
		.from(products)
		.where(lte(products.stockQty, products.lowStockThreshold))
		.get();

	return {
		settings: appSettings,
		lowStockCount: lowStockCount?.count ?? 0
	};
};
