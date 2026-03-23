<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency } from '$lib/utils';
	import { Save, FileText, Cpu, CircuitBoard, MemoryStick, Monitor, HardDrive, Zap, Box, Fan, Check, AlertCircle } from '@lucide/svelte';

	let { data } = $props();

	let buildName = $state('');
	let customerId = $state('');
	let notes = $state('');

	const componentCategories = [
		{ key: 'CPU', label: 'Processor (CPU)', icon: Cpu },
		{ key: 'Motherboard', label: 'Motherboard', icon: CircuitBoard },
		{ key: 'RAM', label: 'Memory (RAM)', icon: MemoryStick },
		{ key: 'GPU', label: 'Graphics Card (GPU)', icon: Monitor },
		{ key: 'Storage', label: 'Storage', icon: HardDrive },
		{ key: 'PSU', label: 'Power Supply (PSU)', icon: Zap },
		{ key: 'Case', label: 'Case', icon: Box },
		{ key: 'Cooling', label: 'Cooling', icon: Fan }
	];

	// Track selected product ID per category
	let selections: Record<string, string> = $state({});

	// Derive selected products with pricing
	let selectedComponents = $derived(
		componentCategories
			.map((cat) => {
				const productId = selections[cat.key];
				if (!productId) return null;
				const products = data.productsByCategory[cat.key] ?? [];
				const product = products.find((p: { id: number }) => String(p.id) === productId);
				return product ? { category: cat.key, ...product } : null;
			})
			.filter(Boolean) as Array<{ category: string; id: number; name: string; sku: string; costPrice: number; sellPrice: number }>
	);

	let totalCost = $derived(selectedComponents.reduce((sum, c) => sum + c.costPrice, 0));
	let totalSell = $derived(selectedComponents.reduce((sum, c) => sum + c.sellPrice, 0));
	let profit = $derived(totalSell - totalCost);
	let componentCount = $derived(selectedComponents.length);
</script>

<div class="flex items-center justify-between mb-6">
	<PageHeader title="PC Builder" description="Configure and price custom PC builds" />
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left: Build Configuration -->
	<div class="lg:col-span-2 space-y-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>Build Details</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="buildName">Build Name</Label>
						<Input id="buildName" placeholder="e.g. Gaming Beast 2026" bind:value={buildName} />
					</div>
					<div class="space-y-2">
						<Label for="customerId">Customer (Optional)</Label>
						<select
							id="customerId"
							bind:value={customerId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">No Customer</option>
							{#each data.customers as customer}
								<option value={customer.id}>{customer.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Component Selection -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Components</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#each componentCategories as cat (cat.key)}
					{@const products = data.productsByCategory[cat.key] ?? []}
					{@const selectedId = selections[cat.key]}
					{@const selectedProduct = products.find((p: { id: number }) => String(p.id) === selectedId)}
					<div class="flex items-center gap-4 rounded-lg border p-4">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
							<cat.icon class="h-5 w-5 text-muted-foreground" />
						</div>
						<div class="flex-1 min-w-0">
							<Label class="text-sm font-medium">{cat.label}</Label>
							{#if products.length > 0}
								<select
									bind:value={selections[cat.key]}
									class="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									<option value="">-- Select {cat.label} --</option>
									{#each products as product}
										<option value={String(product.id)}>
											{product.name} — {formatCurrency(product.sellPrice, data.currencySymbol)}
										</option>
									{/each}
								</select>
							{:else}
								<p class="mt-1 text-xs text-muted-foreground">No products in this category</p>
							{/if}
						</div>
						<div class="w-28 text-right">
							{#if selectedProduct}
								<div class="flex items-center justify-end gap-1">
									<Check class="h-4 w-4 text-green-500" />
									<span class="font-medium">{formatCurrency(selectedProduct.sellPrice, data.currencySymbol)}</span>
								</div>
								<span class="text-xs text-muted-foreground">Cost: {formatCurrency(selectedProduct.costPrice, data.currencySymbol)}</span>
							{:else}
								<span class="text-sm text-muted-foreground">—</span>
							{/if}
						</div>
					</div>
				{/each}

				{#if componentCount < 3 && componentCount > 0}
					<div class="flex items-center gap-2 rounded-md bg-orange-50 p-3 text-sm text-orange-700 dark:bg-orange-950 dark:text-orange-300">
						<AlertCircle class="h-4 w-4 shrink-0" />
						<span>Consider adding more components for a complete build.</span>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<div class="space-y-2">
			<Label for="notes">Notes</Label>
			<Input id="notes" placeholder="Optional build notes" bind:value={notes} />
		</div>
	</div>

	<!-- Right: Summary & Actions -->
	<div>
		<Card.Root class="sticky top-4">
			<Card.Header>
				<Card.Title>Build Summary</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if componentCount === 0}
					<div class="flex flex-col items-center py-8 text-center text-muted-foreground">
						<Cpu class="mb-2 h-10 w-10" />
						<p class="text-sm">Select components to start your build</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each selectedComponents as comp (comp.category)}
							<div class="flex justify-between text-sm">
								<span class="truncate text-muted-foreground">{comp.category}</span>
								<span class="shrink-0 ml-2">{formatCurrency(comp.sellPrice, data.currencySymbol)}</span>
							</div>
						{/each}
					</div>

					<Separator />

					<div class="flex justify-between text-sm">
						<span>Components</span>
						<span>{componentCount} / {componentCategories.length}</span>
					</div>
					<div class="flex justify-between text-sm text-muted-foreground">
						<span>Total Cost</span>
						<span>{formatCurrency(totalCost, data.currencySymbol)}</span>
					</div>
					<div class="flex justify-between text-lg font-bold">
						<span>Sell Price</span>
						<span>{formatCurrency(totalSell, data.currencySymbol)}</span>
					</div>
					<div class="flex justify-between text-sm text-green-600 dark:text-green-400">
						<span>Profit</span>
						<span>{formatCurrency(profit, data.currencySymbol)}</span>
					</div>

					<Separator />

					<div class="space-y-2">
						<form method="POST" action="?/save" use:enhance>
							<input type="hidden" name="buildName" value={buildName} />
							<input type="hidden" name="customerId" value={customerId} />
							<input type="hidden" name="notes" value={notes} />
							<input type="hidden" name="totalCost" value={totalCost} />
							<input type="hidden" name="totalSell" value={totalSell} />
							{#each selectedComponents as comp, i (comp.category)}
								<input type="hidden" name="components[{i}].productId" value={comp.id} />
								<input type="hidden" name="components[{i}].category" value={comp.category} />
								<input type="hidden" name="components[{i}].unitPrice" value={comp.sellPrice} />
								<input type="hidden" name="components[{i}].unitCost" value={comp.costPrice} />
							{/each}
							<Button type="submit" class="w-full" disabled={!buildName || componentCount === 0}>
								<Save class="mr-2 h-4 w-4" />
								Save Build
							</Button>
						</form>

						<form method="POST" action="?/generateQuote" use:enhance>
							<input type="hidden" name="buildName" value={buildName} />
							<input type="hidden" name="customerId" value={customerId} />
							<input type="hidden" name="notes" value={notes} />
							<input type="hidden" name="totalCost" value={totalCost} />
							<input type="hidden" name="totalSell" value={totalSell} />
							{#each selectedComponents as comp, i (comp.category)}
								<input type="hidden" name="components[{i}].productId" value={comp.id} />
								<input type="hidden" name="components[{i}].category" value={comp.category} />
								<input type="hidden" name="components[{i}].unitPrice" value={comp.sellPrice} />
								<input type="hidden" name="components[{i}].unitCost" value={comp.costPrice} />
								<input type="hidden" name="components[{i}].name" value={comp.name} />
								<input type="hidden" name="components[{i}].sku" value={comp.sku} />
							{/each}
							<Button type="submit" variant="outline" class="w-full" disabled={!buildName || componentCount === 0}>
								<FileText class="mr-2 h-4 w-4" />
								Generate Quote
							</Button>
						</form>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
