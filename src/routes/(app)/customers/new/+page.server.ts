import { db } from '$lib/server/db';
import { customers } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString()?.trim();
		const email = form.get('email')?.toString()?.trim() || null;
		const phone = form.get('phone')?.toString()?.trim() || null;
		const address = form.get('address')?.toString()?.trim() || null;
		const notes = form.get('notes')?.toString()?.trim() || null;

		if (!name) {
			return fail(400, { error: 'Name is required', name, email, phone, address, notes });
		}

		try {
			const result = db
				.insert(customers)
				.values({ name, email, phone, address, notes })
				.returning()
				.get();

			redirect(303, `/customers/${result.id}`);
		} catch (err: unknown) {
			if (err instanceof Error && err.message.includes('UNIQUE')) {
				return fail(400, {
					error: 'A customer with this email already exists',
					name,
					email,
					phone,
					address,
					notes
				});
			}
			throw err;
		}
	}
};
