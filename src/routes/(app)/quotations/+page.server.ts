import { db } from '$lib/server/db';
import {
	quotations,
	quotationItems,
	customers,
	sales,
	saleItems,
	products,
	settings
} from '$lib/server/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { generateInvoiceNumber } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	const rows = db
		.select({
			id: quotations.id,
			quoteNumber: quotations.quoteNumber,
			title: quotations.title,
			customerId: quotations.customerId,
			customerName: customers.name,
			subtotal: quotations.subtotal,
			discountAmount: quotations.discountAmount,
			taxAmount: quotations.taxAmount,
			totalAmount: quotations.totalAmount,
			status: quotations.status,
			validUntil: quotations.validUntil,
			convertedToSaleId: quotations.convertedToSaleId,
			createdAt: quotations.createdAt
		})
		.from(quotations)
		.leftJoin(customers, eq(quotations.customerId, customers.id))
		.orderBy(desc(quotations.createdAt))
		.all();

	return {
		quotations: rows,
		currencySymbol: appSettings?.currencySymbol ?? '$'
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { error: 'Invalid quotation ID' });

		db.delete(quotationItems).where(eq(quotationItems.quotationId, id)).run();
		db.delete(quotations).where(eq(quotations.id, id)).run();

		return { success: true };
	},

	convertToSale: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { error: 'Invalid quotation ID' });

		const quotation = db.select().from(quotations).where(eq(quotations.id, id)).get();
		if (!quotation) return fail(404, { error: 'Quotation not found' });
		if (quotation.status === 'converted') return fail(400, { error: 'Already converted' });

		const items = db
			.select()
			.from(quotationItems)
			.where(eq(quotationItems.quotationId, id))
			.all();

		const appSettings = db.select().from(settings).get();
		const invoiceNumber = generateInvoiceNumber('INV');

		// Create the sale
		const saleResult = db
			.insert(sales)
			.values({
				invoiceNumber,
				customerId: quotation.customerId,
				subtotal: quotation.subtotal,
				discountAmount: quotation.discountAmount,
				taxAmount: quotation.taxAmount,
				totalAmount: quotation.totalAmount,
				paymentMethod: 'cash',
				status: 'completed',
				notes: `Converted from quotation ${quotation.quoteNumber}`,
				createdBy: appSettings?.operatorName ?? 'Admin'
			})
			.run();

		const saleId = Number(saleResult.lastInsertRowid);

		// Create sale items and update stock
		for (const item of items) {
			const product = item.productId
				? db.select().from(products).where(eq(products.id, item.productId)).get()
				: null;

			db.insert(saleItems)
				.values({
					saleId,
					productId: item.productId,
					productName: item.productName,
					productSku: item.productSku,
					unitPrice: item.unitPrice,
					unitCost: product?.costPrice ?? 0,
					quantity: item.quantity,
					discountPct: item.discountPct,
					lineTotal: item.lineTotal
				})
				.run();

			// Decrease stock
			if (item.productId) {
				db.update(products)
					.set({
						stockQty: sql`${products.stockQty} - ${item.quantity}`
					})
					.where(eq(products.id, item.productId))
					.run();
			}
		}

		// Mark quotation as converted
		db.update(quotations)
			.set({
				status: 'converted',
				convertedToSaleId: saleId
			})
			.where(eq(quotations.id, id))
			.run();

		return { success: true, saleId };
	}
};
