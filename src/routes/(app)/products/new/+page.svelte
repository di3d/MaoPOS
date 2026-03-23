<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { ArrowLeft, Save } from '@lucide/svelte';

	let { data, form: formResult } = $props<{ data: PageData; form: { error?: string } | null }>();

	let isActive = $state(true);
</script>

<PageHeader title="Add Product" description="Create a new product in your inventory.">
	<Button href="/products" variant="outline" size="sm">
		<ArrowLeft class="mr-1 h-4 w-4" />
		Back
	</Button>
</PageHeader>

{#if formResult?.error}
	<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
		{formResult.error}
	</div>
{/if}

<Card.Root class="max-w-2xl">
	<Card.Header>
		<Card.Title>Product Details</Card.Title>
		<Card.Description>Fill in the information below to add a new product.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance class="space-y-4">
			<div class="grid gap-4 sm:grid-cols-2">
				<!-- SKU -->
				<div class="space-y-2">
					<Label for="sku">SKU *</Label>
					<Input id="sku" name="sku" placeholder="e.g. PRD-001" required />
				</div>

				<!-- Name -->
				<div class="space-y-2">
					<Label for="name">Name *</Label>
					<Input id="name" name="name" placeholder="Product name" required />
				</div>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea id="description" name="description" placeholder="Optional product description..." />
			</div>

			<!-- Category -->
			<div class="space-y-2">
				<Label for="categoryId">Category</Label>
				<select
					id="categoryId"
					name="categoryId"
					class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-8 w-full rounded-lg border px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				>
					<option value="">No category</option>
					{#each data.categories as category (category.id)}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<!-- Cost Price -->
				<div class="space-y-2">
					<Label for="costPrice">Cost Price</Label>
					<Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" value="0" />
				</div>

				<!-- Sell Price -->
				<div class="space-y-2">
					<Label for="sellPrice">Sell Price</Label>
					<Input id="sellPrice" name="sellPrice" type="number" step="0.01" min="0" value="0" />
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<!-- Stock Qty -->
				<div class="space-y-2">
					<Label for="stockQty">Stock Quantity</Label>
					<Input id="stockQty" name="stockQty" type="number" min="0" value="0" />
				</div>

				<!-- Low Stock Threshold -->
				<div class="space-y-2">
					<Label for="lowStockThreshold">Low Stock Threshold</Label>
					<Input id="lowStockThreshold" name="lowStockThreshold" type="number" min="0" value="5" />
				</div>
			</div>

			<!-- Active Toggle -->
			<div class="flex items-center gap-3">
				<input
					type="checkbox"
					id="isActive"
					name="isActive"
					class="h-4 w-4 rounded border-gray-300"
					checked={isActive}
					onchange={(e) => (isActive = e.currentTarget.checked)}
				/>
				<Label for="isActive" class="cursor-pointer">Active</Label>
				<span class="text-xs text-muted-foreground">
					{isActive ? 'Product is visible and available for sale' : 'Product is hidden from sales'}
				</span>
			</div>

			<!-- Submit -->
			<div class="flex justify-end gap-2 pt-4">
				<Button href="/products" variant="outline">Cancel</Button>
				<Button type="submit">
					<Save class="mr-1 h-4 w-4" />
					Create Product
				</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
