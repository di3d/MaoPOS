<script lang="ts">
	import type { PageData } from './$types';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { formatCurrency } from '$lib/utils';
	import { Search, Plus, Pencil, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';

	let { data } = $props<{ data: PageData }>();
	let search = $state('');
	let filtered = $derived(
		data.products.filter(
			(p) =>
				p.name.toLowerCase().includes(search.toLowerCase()) ||
				p.sku.toLowerCase().includes(search.toLowerCase())
		)
	);

	function getStockVariant(product: (typeof data.products)[0]) {
		if (product.stockQty === 0) return 'destructive' as const;
		if (product.stockQty <= product.lowStockThreshold) return 'outline' as const;
		return 'default' as const;
	}

	function getStockLabel(product: (typeof data.products)[0]) {
		if (product.stockQty === 0) return 'Out of Stock';
		if (product.stockQty <= product.lowStockThreshold) return 'Low Stock';
		return 'In Stock';
	}
</script>

<PageHeader title="Products">
	<Button href="/products/new" size="sm">
		<Plus class="mr-1 h-4 w-4" />
		Add Product
	</Button>
</PageHeader>

<!-- Search -->
<div class="relative mb-4 max-w-sm">
	<Search class="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
	<Input
		type="text"
		placeholder="Search by name or SKU..."
		class="pl-9"
		bind:value={search}
	/>
</div>

<!-- Products Table -->
<div class="rounded-lg border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>SKU</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head>Category</Table.Head>
				<Table.Head class="text-right">Cost</Table.Head>
				<Table.Head class="text-right">Sell Price</Table.Head>
				<Table.Head class="text-center">Stock</Table.Head>
				<Table.Head class="text-center">Status</Table.Head>
				<Table.Head class="text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if filtered.length === 0}
				<Table.Row>
					<Table.Cell colspan={8} class="py-8 text-center text-muted-foreground">
						{search ? 'No products match your search.' : 'No products found. Add your first product!'}
					</Table.Cell>
				</Table.Row>
			{:else}
				{#each filtered as product (product.id)}
					<Table.Row>
						<Table.Cell class="font-mono text-xs">{product.sku}</Table.Cell>
						<Table.Cell class="font-medium">{product.name}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{product.categoryName ?? '—'}</Table.Cell>
						<Table.Cell class="text-right">{formatCurrency(product.costPrice)}</Table.Cell>
						<Table.Cell class="text-right">{formatCurrency(product.sellPrice)}</Table.Cell>
						<Table.Cell class="text-center">
							<Badge
								variant={getStockVariant(product)}
								class={product.stockQty > 0 && product.stockQty <= product.lowStockThreshold
									? 'border-orange-400 text-orange-600 dark:text-orange-400'
									: product.stockQty > product.lowStockThreshold
										? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
										: ''}
							>
								{product.stockQty}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-center">
							{#if product.isActive}
								<Badge variant="default" class="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
							{:else}
								<Badge variant="secondary">Inactive</Badge>
							{/if}
						</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex items-center justify-end gap-1">
								<Button href="/products/{product.id}/edit" variant="ghost" size="icon-sm">
									<Pencil class="h-4 w-4" />
									<span class="sr-only">Edit</span>
								</Button>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={product.id} />
									<Button
										type="submit"
										variant="ghost"
										size="icon-sm"
										class="text-destructive hover:text-destructive"
										onclick={(e) => {
											if (!confirm(`Delete "${product.name}"?`)) e.preventDefault();
										}}
									>
										<Trash2 class="h-4 w-4" />
										<span class="sr-only">Delete</span>
									</Button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>
</div>

<p class="mt-2 text-xs text-muted-foreground">
	Showing {filtered.length} of {data.products.length} product{data.products.length !== 1 ? 's' : ''}
</p>
