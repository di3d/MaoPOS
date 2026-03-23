import { db } from '$lib/server/db';
import { sales, saleItems, customers } from '$lib/server/schema';
import { eq, sql, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allSales = db
		.select({
			id: sales.id,
			invoiceNumber: sales.invoiceNumber,
			customerId: sales.customerId,
			customerName: customers.name,
			subtotal: sales.subtotal,
			taxAmount: sales.taxAmount,
			totalAmount: sales.totalAmount,
			paymentMethod: sales.paymentMethod,
			status: sales.status,
			createdAt: sales.createdAt,
			createdBy: sales.createdBy,
			itemCount: sql<number>`(SELECT count(*) FROM sale_items WHERE sale_items.sale_id = ${sales.id})`
		})
		.from(sales)
		.leftJoin(customers, eq(sales.customerId, customers.id))
		.orderBy(desc(sales.createdAt))
		.all();

	return { sales: allSales };
};
