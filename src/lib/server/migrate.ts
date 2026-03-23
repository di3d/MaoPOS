import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';

export function runMigrations() {
	try {
		migrate(db, { migrationsFolder: './drizzle' });
		console.log('✓ Database migrations applied');
	} catch (err) {
		console.error('Migration failed:', err);
		throw err;
	}
}
