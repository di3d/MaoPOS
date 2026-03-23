import { db } from '$lib/server/db';
import { settings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const appSettings = db.select().from(settings).get();

	return {
		settings: appSettings
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = await request.formData();

		const shopName = (formData.get('shopName') as string)?.trim();
		const shopAddress = (formData.get('shopAddress') as string)?.trim() || null;
		const shopPhone = (formData.get('shopPhone') as string)?.trim() || null;
		const shopEmail = (formData.get('shopEmail') as string)?.trim() || null;
		const currency = (formData.get('currency') as string)?.trim() || 'USD';
		const currencySymbol = (formData.get('currencySymbol') as string)?.trim() || '$';
		const taxRate = parseFloat(formData.get('taxRate') as string) || 0;
		const receiptFooter = (formData.get('receiptFooter') as string)?.trim() || null;
		const operatorName = (formData.get('operatorName') as string)?.trim() || 'Admin';

		if (!shopName) {
			return fail(400, { error: 'Shop name is required' });
		}

		if (taxRate < 0 || taxRate > 100) {
			return fail(400, { error: 'Tax rate must be between 0 and 100' });
		}

		// Check if settings row exists
		const existing = db.select().from(settings).get();

		if (existing) {
			db.update(settings)
				.set({
					shopName,
					shopAddress,
					shopPhone,
					shopEmail,
					currency,
					currencySymbol,
					taxRate,
					receiptFooter,
					operatorName
				})
				.where(eq(settings.id, 1))
				.run();
		} else {
			db.insert(settings)
				.values({
					id: 1,
					shopName,
					shopAddress,
					shopPhone,
					shopEmail,
					currency,
					currencySymbol,
					taxRate,
					receiptFooter,
					operatorName
				})
				.run();
		}

		return { success: true };
	}
};
