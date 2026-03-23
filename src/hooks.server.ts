import { runMigrations } from '$lib/server/migrate';
import { seedDatabase } from '$lib/server/seed';

// Run once on server start
try {
	runMigrations();
	seedDatabase();
} catch (err) {
	console.error('Startup error:', err);
}
