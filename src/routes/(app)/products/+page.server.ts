import { db } from '$lib/server/db';
import { products, categories } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const allProducts = db
		.select({
			id: products.id,
			sku: products.sku,
			name: products.name,
			categoryId: products.categoryId,
			categoryName: categories.name,
			costPrice: products.costPrice,
			sellPrice: products.sellPrice,
			stockQty: products.stockQty,
			lowStockThreshold: products.lowStockThreshold,
			isActive: products.isActive
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id))
		.all();

	return { products: allProducts };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'Invalid ID' });
		db.delete(products).where(eq(products.id, id)).run();
		return { success: true };
	}
};
