import { db } from '$lib/server/db';
import { products, customers, sales, saleItems, settings } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const allProducts = db.select().from(products).where(eq(products.isActive, true)).all();
	const allCustomers = db.select().from(customers).all();
	const appSettings = db.select().from(settings).get();
	return { products: allProducts, customers: allCustomers, settings: appSettings };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const cartJson = form.get('cart')?.toString();
		const customerId = Number(form.get('customerId')) || null;
		const paymentMethod = form.get('paymentMethod')?.toString() || 'cash';
		const amountTendered = Number(form.get('amountTendered')) || 0;
		const notes = form.get('notes')?.toString() || null;

		if (!cartJson) return fail(400, { error: 'Cart is empty' });

		const cart = JSON.parse(cartJson) as Array<{
			productId: number;
			name: string;
			sku: string;
			unitPrice: number;
			unitCost: number;
			quantity: number;
			discountPct: number;
		}>;

		if (cart.length === 0) return fail(400, { error: 'Cart is empty' });

		// Generate invoice number
		const now = new Date();
		const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
		const count = db
			.select({ count: sql<number>`count(*)` })
			.from(sales)
			.where(sql`date(${sales.createdAt}) = date('now')`)
			.get();
		const seq = String((count?.count ?? 0) + 1).padStart(4, '0');
		const invoiceNumber = `INV-${dateStr}-${seq}`;

		const subtotal = cart.reduce((sum, item) => {
			const disc = item.unitPrice * item.quantity * (item.discountPct / 100);
			return sum + (item.unitPrice * item.quantity - disc);
		}, 0);

		const appSettings = db.select().from(settings).get();
		const taxRate = appSettings?.taxRate ?? 0;
		const taxAmount = subtotal * taxRate;
		const totalAmount = subtotal + taxAmount;
		const changeGiven = paymentMethod === 'cash' ? amountTendered - totalAmount : 0;

		// Transaction
		const result = db.transaction((tx) => {
			const sale = tx
				.insert(sales)
				.values({
					invoiceNumber,
					customerId,
					subtotal,
					taxAmount,
					totalAmount,
					paymentMethod,
					amountTendered: paymentMethod === 'cash' ? amountTendered : totalAmount,
					changeGiven: paymentMethod === 'cash' ? changeGiven : 0,
					notes,
					createdBy: appSettings?.operatorName ?? 'Admin'
				})
				.returning()
				.get();

			for (const item of cart) {
				const disc = item.unitPrice * item.quantity * (item.discountPct / 100);
				const lineTotal = item.unitPrice * item.quantity - disc;

				tx.insert(saleItems)
					.values({
						saleId: sale.id,
						productId: item.productId,
						productName: item.name,
						productSku: item.sku,
						unitPrice: item.unitPrice,
						unitCost: item.unitCost,
						quantity: item.quantity,
						discountPct: item.discountPct,
						lineTotal
					})
					.run();

				// Decrement stock
				tx.update(products)
					.set({ stockQty: sql`${products.stockQty} - ${item.quantity}` })
					.where(eq(products.id, item.productId))
					.run();
			}

			return sale;
		});

		redirect(303, `/sales/history/${result.id}`);
	}
};
