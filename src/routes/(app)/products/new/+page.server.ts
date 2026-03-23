import { db } from '$lib/server/db';
import { products, categories } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const allCategories = db.select().from(categories).all();
	return { categories: allCategories };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const sku = form.get('sku')?.toString().trim();
		const name = form.get('name')?.toString().trim();
		if (!sku || !name) return fail(400, { error: 'SKU and Name are required' });

		db.insert(products)
			.values({
				sku,
				name,
				description: form.get('description')?.toString() || null,
				categoryId: Number(form.get('categoryId')) || null,
				costPrice: Number(form.get('costPrice')) || 0,
				sellPrice: Number(form.get('sellPrice')) || 0,
				stockQty: Number(form.get('stockQty')) || 0,
				lowStockThreshold: Number(form.get('lowStockThreshold')) || 5,
				isActive: form.get('isActive') === 'on'
			})
			.run();

		redirect(303, '/products');
	}
};
