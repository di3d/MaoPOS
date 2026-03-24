import { db } from '$lib/server/db';
import { sales, saleItems, customers, products, settings } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const saleId = Number(params.id);
	if (isNaN(saleId)) error(400, 'Invalid sale ID');

	const sale = db.select().from(sales).where(eq(sales.id, saleId)).get();
	if (!sale) error(404, 'Sale not found');

	const items = db.select().from(saleItems).where(eq(saleItems.saleId, saleId)).all();

	const customer = sale.customerId
		? db.select().from(customers).where(eq(customers.id, sale.customerId)).get()
		: null;

	const appSettings = db.select().from(settings).get();
	const allCustomers = db.select().from(customers).all();

	return { sale, items, customer, settings: appSettings, customers: allCustomers };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const saleId = Number(params.id);
		if (isNaN(saleId)) return fail(400, { error: 'Invalid sale ID' });

		const sale = db.select().from(sales).where(eq(sales.id, saleId)).get();
		if (!sale) return fail(404, { error: 'Sale not found' });
		if (sale.status === 'voided') return fail(400, { error: 'Cannot edit a voided sale' });

		const form = await request.formData();
		const itemsJson = form.get('items')?.toString();
		const customerId = Number(form.get('customerId')) || null;
		const paymentMethod = form.get('paymentMethod')?.toString() || sale.paymentMethod;
		const amountTendered = Number(form.get('amountTendered')) || 0;
		const notes = form.get('notes')?.toString() || null;

		if (!itemsJson) return fail(400, { error: 'No items provided' });

		const updatedItems = JSON.parse(itemsJson) as Array<{
			id: number | null;
			productId: number;
			productName: string;
			productSku: string;
			unitPrice: number;
			unitCost: number;
			quantity: number;
			discountPct: number;
		}>;

		if (updatedItems.length === 0) return fail(400, { error: 'Sale must have at least one item' });

		const appSettings = db.select().from(settings).get();
		const taxRate = appSettings?.taxRate ?? 0;

		const subtotal = updatedItems.reduce((sum, item) => {
			const disc = item.unitPrice * item.quantity * (item.discountPct / 100);
			return sum + (item.unitPrice * item.quantity - disc);
		}, 0);
		const taxAmount = subtotal * taxRate;
		const totalAmount = subtotal + taxAmount;
		const changeGiven = paymentMethod === 'cash' ? amountTendered - totalAmount : 0;

		// Get old items to restore stock
		const oldItems = db.select().from(saleItems).where(eq(saleItems.saleId, saleId)).all();

		db.transaction((tx) => {
			// Restore stock for old items
			for (const item of oldItems) {
				if (item.productId) {
					tx.update(products)
						.set({ stockQty: sql`${products.stockQty} + ${item.quantity}` })
						.where(eq(products.id, item.productId))
						.run();
				}
			}

			// Delete old sale items
			tx.delete(saleItems).where(eq(saleItems.saleId, saleId)).run();

			// Insert new sale items and decrement stock
			for (const item of updatedItems) {
				const disc = item.unitPrice * item.quantity * (item.discountPct / 100);
				const lineTotal = item.unitPrice * item.quantity - disc;

				tx.insert(saleItems)
					.values({
						saleId,
						productId: item.productId,
						productName: item.productName,
						productSku: item.productSku,
						unitPrice: item.unitPrice,
						unitCost: item.unitCost,
						quantity: item.quantity,
						discountPct: item.discountPct,
						lineTotal
					})
					.run();

				if (item.productId) {
					tx.update(products)
						.set({ stockQty: sql`${products.stockQty} - ${item.quantity}` })
						.where(eq(products.id, item.productId))
						.run();
				}
			}

			// Update sale record
			tx.update(sales)
				.set({
					customerId,
					subtotal,
					taxAmount,
					totalAmount,
					paymentMethod,
					amountTendered: paymentMethod === 'cash' ? amountTendered : totalAmount,
					changeGiven: paymentMethod === 'cash' ? changeGiven : 0,
					notes
				})
				.where(eq(sales.id, saleId))
				.run();
		});

		return { success: true, message: 'Sale updated successfully' };
	},

	void: async ({ params }) => {
		const saleId = Number(params.id);
		if (isNaN(saleId)) return fail(400, { error: 'Invalid sale ID' });

		const sale = db.select().from(sales).where(eq(sales.id, saleId)).get();
		if (!sale) return fail(404, { error: 'Sale not found' });
		if (sale.status === 'voided') return fail(400, { error: 'Sale is already voided' });

		const items = db.select().from(saleItems).where(eq(saleItems.saleId, saleId)).all();

		db.transaction((tx) => {
			// Restore stock for all items
			for (const item of items) {
				if (item.productId) {
					tx.update(products)
						.set({ stockQty: sql`${products.stockQty} + ${item.quantity}` })
						.where(eq(products.id, item.productId))
						.run();
				}
			}

			// Mark sale as voided
			tx.update(sales)
				.set({ status: 'voided' })
				.where(eq(sales.id, saleId))
				.run();
		});

		return { success: true, message: 'Sale voided successfully' };
	}
};
