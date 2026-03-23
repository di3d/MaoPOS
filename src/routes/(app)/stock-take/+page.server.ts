import { db } from '$lib/server/db';
import { products, stockTakes, stockTakeItems, settings } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	const allProducts = db
		.select({
			id: products.id,
			sku: products.sku,
			name: products.name,
			stockQty: products.stockQty
		})
		.from(products)
		.where(eq(products.isActive, true))
		.orderBy(products.name)
		.all();

	return {
		products: allProducts,
		currencySymbol: appSettings?.currencySymbol ?? '$'
	};
};

export const actions: Actions = {
	commit: async ({ request }) => {
		const formData = await request.formData();

		// Parse product counts from form data
		const productUpdates: Array<{
			id: number;
			systemQty: number;
			countedQty: number;
		}> = [];

		// Iterate through form data to find all product entries
		for (const [key, value] of formData.entries()) {
			const idMatch = key.match(/^products\[(\d+)\]\.id$/);
			if (idMatch) {
				const productId = parseInt(value as string);
				const systemQty = parseInt(formData.get(`products[${idMatch[1]}].systemQty`) as string) || 0;
				const countedQty = parseInt(formData.get(`products[${idMatch[1]}].countedQty`) as string) || 0;

				productUpdates.push({
					id: productId,
					systemQty,
					countedQty
				});
			}
		}

		if (productUpdates.length === 0) {
			return fail(400, { error: 'No products to update' });
		}

		// Create stock take record
		const takeResult = db
			.insert(stockTakes)
			.values({
				notes: `Stock take with ${productUpdates.length} products`,
				status: 'completed',
				completedAt: new Date().toISOString()
			})
			.run();

		const stockTakeId = Number(takeResult.lastInsertRowid);

		// Create stock take items and update product quantities
		for (const update of productUpdates) {
			// Record the stock take item
			db.insert(stockTakeItems)
				.values({
					stockTakeId,
					productId: update.id,
					systemQty: update.systemQty,
					countedQty: update.countedQty
				})
				.run();

			// Update the product's stock quantity to match counted
			if (update.countedQty !== update.systemQty) {
				db.update(products)
					.set({
						stockQty: update.countedQty,
						updatedAt: new Date().toISOString()
					})
					.where(eq(products.id, update.id))
					.run();
			}
		}

		return { success: true, message: 'Stock take committed successfully' };
	}
};
