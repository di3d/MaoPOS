import { db } from '$lib/server/db';
import { sales, saleItems, customers, settings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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

	return { sale, items, customer, settings: appSettings };
};
