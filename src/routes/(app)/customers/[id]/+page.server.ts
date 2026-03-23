import { db } from '$lib/server/db';
import { customers, sales, saleItems, settings } from '$lib/server/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const customerId = Number(params.id);
	if (isNaN(customerId)) error(400, 'Invalid customer ID');

	const customer = db.select().from(customers).where(eq(customers.id, customerId)).get();
	if (!customer) error(404, 'Customer not found');

	const customerSales = db
		.select({
			id: sales.id,
			invoiceNumber: sales.invoiceNumber,
			totalAmount: sales.totalAmount,
			paymentMethod: sales.paymentMethod,
			status: sales.status,
			createdAt: sales.createdAt,
			itemCount: sql<number>`(SELECT count(*) FROM sale_items WHERE sale_items.sale_id = ${sales.id})`
		})
		.from(sales)
		.where(eq(sales.customerId, customerId))
		.orderBy(desc(sales.createdAt))
		.all();

	const totalSpent = customerSales.reduce((sum, s) => sum + s.totalAmount, 0);
	const appSettings = db.select().from(settings).get();

	return { customer, sales: customerSales, totalSpent, settings: appSettings };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const customerId = Number(params.id);
		const form = await request.formData();
		const name = form.get('name')?.toString()?.trim();
		const email = form.get('email')?.toString()?.trim() || null;
		const phone = form.get('phone')?.toString()?.trim() || null;
		const address = form.get('address')?.toString()?.trim() || null;
		const notes = form.get('notes')?.toString()?.trim() || null;

		if (!name) return fail(400, { error: 'Name is required' });

		try {
			db.update(customers)
				.set({ name, email, phone, address, notes })
				.where(eq(customers.id, customerId))
				.run();

			return { success: true };
		} catch (err: unknown) {
			if (err instanceof Error && err.message.includes('UNIQUE')) {
				return fail(400, { error: 'A customer with this email already exists' });
			}
			throw err;
		}
	},

	delete: async ({ params }) => {
		const customerId = Number(params.id);

		const saleCount = db
			.select({ count: sql<number>`count(*)` })
			.from(sales)
			.where(eq(sales.customerId, customerId))
			.get();

		if (saleCount && saleCount.count > 0) {
			return fail(400, { error: 'Cannot delete customer with existing sales' });
		}

		db.delete(customers).where(eq(customers.id, customerId)).run();
		redirect(303, '/customers');
	}
};
