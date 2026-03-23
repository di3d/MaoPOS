import { db } from '$lib/server/db';
import { products, customers, quotations, quotationItems, settings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { generateInvoiceNumber } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	const allProducts = db
		.select()
		.from(products)
		.where(eq(products.isActive, true))
		.all();

	const allCustomers = db.select().from(customers).all();

	return {
		products: allProducts,
		customers: allCustomers,
		taxRate: appSettings?.taxRate ?? 0,
		currencySymbol: appSettings?.currencySymbol ?? '$'
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		const title = formData.get('title') as string;
		const customerId = formData.get('customerId') as string;
		const validUntil = formData.get('validUntil') as string;
		const notes = formData.get('notes') as string;
		const subtotal = parseFloat(formData.get('subtotal') as string) || 0;
		const taxAmount = parseFloat(formData.get('taxAmount') as string) || 0;
		const totalAmount = parseFloat(formData.get('totalAmount') as string) || 0;

		// Parse items from form
		const items: Array<{
			productId: number;
			name: string;
			sku: string;
			unitPrice: number;
			quantity: number;
			discountPct: number;
		}> = [];

		let i = 0;
		while (formData.has(`items[${i}].productId`)) {
			const unitPrice = parseFloat(formData.get(`items[${i}].unitPrice`) as string) || 0;
			const quantity = parseInt(formData.get(`items[${i}].quantity`) as string) || 1;
			const discountPct = parseFloat(formData.get(`items[${i}].discountPct`) as string) || 0;

			items.push({
				productId: parseInt(formData.get(`items[${i}].productId`) as string),
				name: formData.get(`items[${i}].name`) as string,
				sku: formData.get(`items[${i}].sku`) as string,
				unitPrice,
				quantity,
				discountPct
			});
			i++;
		}

		if (items.length === 0) {
			return fail(400, { error: 'Please add at least one item' });
		}

		const quoteNumber = generateInvoiceNumber('QUO');

		const result = db
			.insert(quotations)
			.values({
				quoteNumber,
				customerId: customerId ? parseInt(customerId) : null,
				title: title || null,
				subtotal,
				discountAmount: 0,
				taxAmount,
				totalAmount,
				notes: notes || null,
				validUntil: validUntil || null,
				status: 'draft'
			})
			.run();

		const quotationId = Number(result.lastInsertRowid);

		for (const item of items) {
			const discount = item.unitPrice * item.quantity * (item.discountPct / 100);
			const lineTotal = item.unitPrice * item.quantity - discount;

			db.insert(quotationItems)
				.values({
					quotationId,
					productId: item.productId,
					productName: item.name,
					productSku: item.sku,
					unitPrice: item.unitPrice,
					quantity: item.quantity,
					discountPct: item.discountPct,
					lineTotal
				})
				.run();
		}

		redirect(303, '/quotations');
	}
};
