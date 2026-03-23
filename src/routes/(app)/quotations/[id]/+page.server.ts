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
import { eq, sql } from 'drizzle-orm';
import { generateInvoiceNumber } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid quotation ID');

	const appSettings = db.select().from(settings).get();

	const row = db
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
			notes: quotations.notes,
			validUntil: quotations.validUntil,
			status: quotations.status,
			convertedToSaleId: quotations.convertedToSaleId,
			createdAt: quotations.createdAt
		})
		.from(quotations)
		.leftJoin(customers, eq(quotations.customerId, customers.id))
		.where(eq(quotations.id, id))
		.get();

	if (!row) throw error(404, 'Quotation not found');

	const items = db
		.select()
		.from(quotationItems)
		.where(eq(quotationItems.quotationId, id))
		.all();

	return {
		quotation: row,
		items,
		currencySymbol: appSettings?.currencySymbol ?? '$'
	};
};

export const actions: Actions = {
	convertToSale: async ({ params }) => {
		const id = parseInt(params.id);
		if (isNaN(id)) return fail(400, { error: 'Invalid quotation ID' });

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

			if (item.productId) {
				db.update(products)
					.set({
						stockQty: sql`${products.stockQty} - ${item.quantity}`
					})
					.where(eq(products.id, item.productId))
					.run();
			}
		}

		db.update(quotations)
			.set({
				status: 'converted',
				convertedToSaleId: saleId
			})
			.where(eq(quotations.id, id))
			.run();

		redirect(303, '/quotations');
	}
};
