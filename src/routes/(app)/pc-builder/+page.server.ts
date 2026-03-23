import { db } from '$lib/server/db';
import {
	products,
	categories,
	customers,
	pcBuilds,
	pcBuildItems,
	quotations,
	quotationItems,
	settings
} from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { generateInvoiceNumber } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	// Load categories that are components
	const componentCategories = db
		.select()
		.from(categories)
		.where(eq(categories.isComponent, true))
		.all();

	// Load products for each component category
	const allProducts = db
		.select({
			id: products.id,
			name: products.name,
			sku: products.sku,
			costPrice: products.costPrice,
			sellPrice: products.sellPrice,
			stockQty: products.stockQty,
			categoryId: products.categoryId,
			categoryName: categories.name
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id))
		.where(eq(products.isActive, true))
		.all();

	// Group products by category name
	const productsByCategory: Record<string, typeof allProducts> = {};
	for (const cat of componentCategories) {
		productsByCategory[cat.name] = allProducts.filter((p) => p.categoryId === cat.id);
	}

	const allCustomers = db.select().from(customers).all();

	return {
		productsByCategory,
		categories: componentCategories,
		customers: allCustomers,
		currencySymbol: appSettings?.currencySymbol ?? '$'
	};
};

function parseComponents(formData: FormData) {
	const components: Array<{
		productId: number;
		category: string;
		unitPrice: number;
		unitCost: number;
		name?: string;
		sku?: string;
	}> = [];

	let i = 0;
	while (formData.has(`components[${i}].productId`)) {
		components.push({
			productId: parseInt(formData.get(`components[${i}].productId`) as string),
			category: formData.get(`components[${i}].category`) as string,
			unitPrice: parseFloat(formData.get(`components[${i}].unitPrice`) as string) || 0,
			unitCost: parseFloat(formData.get(`components[${i}].unitCost`) as string) || 0,
			name: (formData.get(`components[${i}].name`) as string) || undefined,
			sku: (formData.get(`components[${i}].sku`) as string) || undefined
		});
		i++;
	}

	return components;
}

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = await request.formData();
		const buildName = (formData.get('buildName') as string)?.trim();
		const customerId = formData.get('customerId') as string;
		const notes = formData.get('notes') as string;
		const totalCost = parseFloat(formData.get('totalCost') as string) || 0;
		const totalSell = parseFloat(formData.get('totalSell') as string) || 0;

		if (!buildName) return fail(400, { error: 'Build name is required' });

		const components = parseComponents(formData);
		if (components.length === 0) return fail(400, { error: 'Add at least one component' });

		// Find category IDs
		const allCategories = db.select().from(categories).all();
		const catMap = new Map(allCategories.map((c) => [c.name, c.id]));

		const result = db
			.insert(pcBuilds)
			.values({
				name: buildName,
				customerId: customerId ? parseInt(customerId) : null,
				totalCost,
				totalSell,
				notes: notes || null,
				status: 'draft'
			})
			.run();

		const buildId = Number(result.lastInsertRowid);

		for (const comp of components) {
			db.insert(pcBuildItems)
				.values({
					buildId,
					productId: comp.productId,
					categoryId: catMap.get(comp.category) ?? null,
					quantity: 1,
					unitPrice: comp.unitPrice,
					unitCost: comp.unitCost
				})
				.run();
		}

		return { success: true, message: 'Build saved successfully' };
	},

	generateQuote: async ({ request }) => {
		const formData = await request.formData();
		const buildName = (formData.get('buildName') as string)?.trim();
		const customerId = formData.get('customerId') as string;
		const notes = formData.get('notes') as string;
		const totalSell = parseFloat(formData.get('totalSell') as string) || 0;

		if (!buildName) return fail(400, { error: 'Build name is required' });

		const components = parseComponents(formData);
		if (components.length === 0) return fail(400, { error: 'Add at least one component' });

		const appSettings = db.select().from(settings).get();
		const taxRate = appSettings?.taxRate ?? 0;
		const subtotal = totalSell;
		const taxAmount = subtotal * (taxRate / 100);
		const totalAmount = subtotal + taxAmount;

		// Set valid until to 30 days from now
		const validDate = new Date();
		validDate.setDate(validDate.getDate() + 30);
		const validUntil = validDate.toISOString().slice(0, 10);

		const quoteNumber = generateInvoiceNumber('QUO');

		const quoteResult = db
			.insert(quotations)
			.values({
				quoteNumber,
				customerId: customerId ? parseInt(customerId) : null,
				title: `PC Build: ${buildName}`,
				subtotal,
				discountAmount: 0,
				taxAmount,
				totalAmount,
				notes: notes || null,
				validUntil,
				status: 'draft'
			})
			.run();

		const quotationId = Number(quoteResult.lastInsertRowid);

		for (const comp of components) {
			const product = db.select().from(products).where(eq(products.id, comp.productId)).get();
			if (!product) continue;

			db.insert(quotationItems)
				.values({
					quotationId,
					productId: comp.productId,
					productName: comp.name ?? product.name,
					productSku: comp.sku ?? product.sku,
					unitPrice: comp.unitPrice,
					quantity: 1,
					discountPct: 0,
					lineTotal: comp.unitPrice
				})
				.run();
		}

		// Also save the build record, linked to the quotation
		const allCategories = db.select().from(categories).all();
		const catMap = new Map(allCategories.map((c) => [c.name, c.id]));

		const buildResult = db
			.insert(pcBuilds)
			.values({
				name: buildName,
				customerId: customerId ? parseInt(customerId) : null,
				totalCost: parseFloat(formData.get('totalCost') as string) || 0,
				totalSell,
				notes: notes || null,
				status: 'quoted',
				quotationId
			})
			.run();

		const buildId = Number(buildResult.lastInsertRowid);

		for (const comp of components) {
			db.insert(pcBuildItems)
				.values({
					buildId,
					productId: comp.productId,
					categoryId: catMap.get(comp.category) ?? null,
					quantity: 1,
					unitPrice: comp.unitPrice,
					unitCost: comp.unitCost
				})
				.run();
		}

		redirect(303, '/quotations');
	}
};
