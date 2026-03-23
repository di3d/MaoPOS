import { db } from '$lib/server/db';
import { customers, sales } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const allCustomers = db
		.select({
			id: customers.id,
			name: customers.name,
			email: customers.email,
			phone: customers.phone,
			address: customers.address,
			notes: customers.notes,
			createdAt: customers.createdAt,
			saleCount: sql<number>`(SELECT count(*) FROM sales WHERE sales.customer_id = ${customers.id})`
		})
		.from(customers)
		.all();

	return { customers: allCustomers };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'Invalid customer ID' });

		// Check if customer has sales
		const saleCount = db
			.select({ count: sql<number>`count(*)` })
			.from(sales)
			.where(eq(sales.customerId, id))
			.get();

		if (saleCount && saleCount.count > 0) {
			return fail(400, { error: 'Cannot delete customer with existing sales' });
		}

		db.delete(customers).where(eq(customers.id, id)).run();
		return { success: true };
	}
};
