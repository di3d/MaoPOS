<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Search, ClipboardCheck, AlertTriangle } from '@lucide/svelte';

	let { data } = $props();

	let search = $state('');

	interface CountedProduct {
		id: number;
		sku: string;
		name: string;
		stockQty: number;
		countedQty: string;
	}

	let countedProducts: CountedProduct[] = $state(
		data.products.map((p) => ({
			id: p.id,
			sku: p.sku,
			name: p.name,
			stockQty: p.stockQty,
			countedQty: String(p.stockQty)
		}))
	);

	let filtered = $derived(
		countedProducts.filter(
			(p) =>
				p.name.toLowerCase().includes(search.toLowerCase()) ||
				p.sku.toLowerCase().includes(search.toLowerCase())
		)
	);

	let totalVariance = $derived(
		countedProducts.reduce((sum, p) => {
			const counted = parseInt(p.countedQty) || 0;
			return sum + Math.abs(counted - p.stockQty);
		}, 0)
	);

	let itemsWithVariance = $derived(
		countedProducts.filter((p) => {
			const counted = parseInt(p.countedQty) || 0;
			return counted !== p.stockQty;
		}).length
	);

	function getVariance(systemQty: number, countedQty: string): number {
		return (parseInt(countedQty) || 0) - systemQty;
	}

	function getVarianceColor(variance: number): string {
		if (variance === 0) return 'text-green-600 dark:text-green-400';
		if (variance < 0) return 'text-red-600 dark:text-red-400';
		return 'text-orange-600 dark:text-orange-400';
	}

	function getVarianceBg(variance: number): string {
		if (variance === 0) return '';
		if (variance < 0) return 'bg-red-50 dark:bg-red-950/30';
		return 'bg-orange-50 dark:bg-orange-950/30';
	}
</script>

<div class="flex items-center justify-between mb-6">
	<PageHeader title="Stock Take" description="Count and reconcile physical inventory" />
</div>

<!-- Summary Cards -->
<div class="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
	<Card.Root>
		<Card.Header>
			<Card.Description>Total Products</Card.Description>
			<Card.Title class="text-2xl">{countedProducts.length}</Card.Title>
		</Card.Header>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Description>Items with Variance</Card.Description>
			<Card.Title class="text-2xl {itemsWithVariance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}">
				{itemsWithVariance}
			</Card.Title>
		</Card.Header>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Description>Total Absolute Variance</Card.Description>
			<Card.Title class="text-2xl {totalVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">
				{totalVariance}
			</Card.Title>
		</Card.Header>
	</Card.Root>
</div>

<!-- Search -->
<div class="mb-4 flex items-center gap-4">
	<div class="relative flex-1 max-w-sm">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input placeholder="Search by name or SKU..." class="pl-9" bind:value={search} />
	</div>
</div>

<!-- Stock Take Table -->
<form
	method="POST"
	action="?/commit"
	use:enhance={({ formData }) => {
		// Inject current counted state before submission
		for (const product of countedProducts) {
			formData.append(`products[${product.id}].id`, String(product.id));
			formData.append(`products[${product.id}].systemQty`, String(product.stockQty));
			formData.append(`products[${product.id}].countedQty`, String(parseInt(product.countedQty) || 0));
		}
		return async ({ result }) => {
			if (result.type === 'success') {
				toast.success('Stock take committed successfully');
				await invalidateAll();
				// Reset counted quantities to match new system quantities
				countedProducts = data.products.map((p) => ({
					id: p.id,
					sku: p.sku,
					name: p.name,
					stockQty: p.stockQty,
					countedQty: String(p.stockQty)
				}));
			} else {
				toast.error('Failed to commit stock take');
			}
		};
	}}
>
	<Card.Root>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>SKU</Table.Head>
						<Table.Head>Product Name</Table.Head>
						<Table.Head class="text-center w-28">System Qty</Table.Head>
						<Table.Head class="text-center w-36">Counted Qty</Table.Head>
						<Table.Head class="text-center w-28">Variance</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filtered as product (product.id)}
						{@const variance = getVariance(product.stockQty, product.countedQty)}
						{@const varColor = getVarianceColor(variance)}
						{@const varBg = getVarianceBg(variance)}
						<Table.Row class={varBg}>
							<Table.Cell class="font-mono text-sm">{product.sku}</Table.Cell>
							<Table.Cell class="font-medium">{product.name}</Table.Cell>
							<Table.Cell class="text-center text-muted-foreground">{product.stockQty}</Table.Cell>
							<Table.Cell class="text-center">
								<Input
									type="number"
									min="0"
									class="h-8 w-20 mx-auto text-center"
									bind:value={product.countedQty}
								/>
							</Table.Cell>
							<Table.Cell class="text-center font-medium {varColor}">
								{variance > 0 ? '+' : ''}{variance}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<div class="mt-6 flex items-center justify-between">
		{#if itemsWithVariance > 0}
			<div class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
				<AlertTriangle class="h-4 w-4" />
				<span>{itemsWithVariance} item{itemsWithVariance !== 1 ? 's' : ''} will be adjusted</span>
			</div>
		{:else}
			<div class="text-sm text-muted-foreground">All quantities match system records</div>
		{/if}
		<Button type="submit" size="lg">
			<ClipboardCheck class="mr-2 h-4 w-4" />
			Commit Stock Take
		</Button>
	</div>
</form>
