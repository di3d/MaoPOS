import { eq } from 'drizzle-orm';
import { db } from './db';
import { categories, products, settings } from './schema';

export async function seedDatabase() {
	// Seed settings (single row)
	const existingSettings = db.select().from(settings).where(eq(settings.id, 1)).get();
	if (!existingSettings) {
		db.insert(settings)
			.values({
				id: 1,
				shopName: 'MaoPOS',
				currency: 'USD',
				currencySymbol: '$',
				taxRate: 0,
				operatorName: 'Admin'
			})
			.run();
		console.log('✓ Settings seeded');
	}

	// Seed categories
	const existingCats = db.select().from(categories).all();
	if (existingCats.length === 0) {
		const cats = [
			{ name: 'CPU', isComponent: true, sortOrder: 1 },
			{ name: 'Motherboard', isComponent: true, sortOrder: 2 },
			{ name: 'RAM', isComponent: true, sortOrder: 3 },
			{ name: 'GPU', isComponent: true, sortOrder: 4 },
			{ name: 'Storage', isComponent: true, sortOrder: 5 },
			{ name: 'PSU', isComponent: true, sortOrder: 6 },
			{ name: 'Case', isComponent: true, sortOrder: 7 },
			{ name: 'Cooling', isComponent: true, sortOrder: 8 },
			{ name: 'Accessories', isComponent: false, sortOrder: 9 },
			{ name: 'Monitor', isComponent: false, sortOrder: 10 },
			{ name: 'Keyboard', isComponent: false, sortOrder: 11 },
			{ name: 'Mouse', isComponent: false, sortOrder: 12 }
		];
		db.insert(categories).values(cats).run();
		console.log('✓ Categories seeded');

		// Seed sample products
		const cpuCat = db.select().from(categories).where(eq(categories.name, 'CPU')).get();
		const ramCat = db.select().from(categories).where(eq(categories.name, 'RAM')).get();
		const gpuCat = db.select().from(categories).where(eq(categories.name, 'GPU')).get();
		const storageCat = db.select().from(categories).where(eq(categories.name, 'Storage')).get();
		const coolingCat = db.select().from(categories).where(eq(categories.name, 'Cooling')).get();
		const mbCat = db
			.select()
			.from(categories)
			.where(eq(categories.name, 'Motherboard'))
			.get();

		const sampleProducts = [
			{
				sku: 'CPU-R5-5600',
				name: 'Ryzen 5 5600',
				categoryId: cpuCat?.id,
				costPrice: 90,
				sellPrice: 120,
				stockQty: 1,
				lowStockThreshold: 3
			},
			{
				sku: 'CPU-R5-2600',
				name: 'Ryzen 5 2600x 6C/12T',
				categoryId: cpuCat?.id,
				costPrice: 50,
				sellPrice: 75,
				stockQty: 1,
				lowStockThreshold: 3
			},
			{
				sku: 'RAM-XPG-SX8200',
				name: 'XPG SX8200 256GB M.2',
				categoryId: storageCat?.id,
				costPrice: 25,
				sellPrice: 45,
				stockQty: 1,
				lowStockThreshold: 3
			},
			{
				sku: 'COOL-TPA',
				name: 'Thermalright Peerless Assassin',
				categoryId: coolingCat?.id,
				costPrice: 30,
				sellPrice: 50,
				stockQty: 1,
				lowStockThreshold: 3
			},
			{
				sku: 'CASE-CM-E301',
				name: 'Coolemaster Elite 301',
				categoryId: db.select().from(categories).where(eq(categories.name, 'Case')).get()?.id
					? db.select().from(categories).where(eq(categories.name, 'Case')).get()!.id
					: undefined,
				costPrice: 40,
				sellPrice: 65,
				stockQty: 3,
				lowStockThreshold: 3
			},
			{
				sku: 'GPU-RX-6600',
				name: 'RX 6600 XT',
				categoryId: gpuCat?.id,
				costPrice: 180,
				sellPrice: 249,
				stockQty: 5,
				lowStockThreshold: 3
			},
			{
				sku: 'RAM-16GB-DDR4',
				name: '16GB DDR4 3200MHz',
				categoryId: ramCat?.id,
				costPrice: 35,
				sellPrice: 55,
				stockQty: 8,
				lowStockThreshold: 3
			},
			{
				sku: 'MB-B550M',
				name: 'B550M AORUS Elite',
				categoryId: mbCat?.id,
				costPrice: 90,
				sellPrice: 130,
				stockQty: 4,
				lowStockThreshold: 3
			}
		];

		db.insert(products).values(sampleProducts).run();
		console.log('✓ Sample products seeded');
	}
}
