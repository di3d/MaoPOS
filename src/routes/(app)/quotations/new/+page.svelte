<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency } from '$lib/utils';
	import { Plus, Minus, Trash2, Search, ShoppingCart } from '@lucide/svelte';

	let { data } = $props();

	let title = $state('');
	let customerId = $state('');
	let validUntil = $state('');
	let notes = $state('');
	let searchQuery = $state('');

	interface CartItem {
		productId: number;
		name: string;
		sku: string;
		unitPrice: number;
		quantity: number;
		discountPct: number;
	}

	let cartItems: CartItem[] = $state([]);

	let filteredProducts = $derived(
		searchQuery.length >= 1
			? data.products.filter(
					(p) =>
						p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						p.sku.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: []
	);

	let subtotal = $derived(
		cartItems.reduce((sum, item) => {
			const discount = item.unitPrice * item.quantity * (item.discountPct / 100);
			return sum + item.unitPrice * item.quantity - discount;
		}, 0)
	);

	let taxAmount = $derived(subtotal * (data.taxRate / 100));
	let totalAmount = $derived(subtotal + taxAmount);

	function addProduct(product: (typeof data.products)[0]) {
		const existing = cartItems.find((i) => i.productId === product.id);
		if (existing) {
			existing.quantity += 1;
		} else {
			cartItems.push({
				productId: product.id,
				name: product.name,
				sku: product.sku,
				unitPrice: product.sellPrice,
				quantity: 1,
				discountPct: 0
			});
		}
		searchQuery = '';
	}

	function removeItem(index: number) {
		cartItems.splice(index, 1);
	}

	function updateQuantity(index: number, delta: number) {
		const item = cartItems[index];
		const newQty = item.quantity + delta;
		if (newQty < 1) {
			removeItem(index);
		} else {
			item.quantity = newQty;
		}
	}
</script>

<PageHeader title="New Quotation" description="Create a new quote for a customer" />

<form method="POST" action="?/create" use:enhance>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left: Product Search & Cart -->
		<div class="lg:col-span-2 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Quote Details</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="title">Title</Label>
							<Input id="title" name="title" placeholder="e.g. Gaming PC Quote" bind:value={title} />
						</div>
						<div class="space-y-2">
							<Label for="customerId">Customer</Label>
							<select
								id="customerId"
								name="customerId"
								bind:value={customerId}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<option value="">Walk-in Customer</option>
								{#each data.customers as customer}
									<option value={customer.id}>{customer.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="validUntil">Valid Until</Label>
							<Input id="validUntil" name="validUntil" type="date" bind:value={validUntil} />
						</div>
						<div class="space-y-2">
							<Label for="notes">Notes</Label>
							<Input id="notes" name="notes" placeholder="Optional notes" bind:value={notes} />
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Product Search -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Add Products</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="relative">
						<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search products by name or SKU..."
							class="pl-9"
							bind:value={searchQuery}
						/>
					</div>
					{#if filteredProducts.length > 0}
						<div class="mt-2 max-h-60 overflow-y-auto rounded-md border">
							{#each filteredProducts as product (product.id)}
								<button
									type="button"
									class="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors"
									onclick={() => addProduct(product)}
								>
									<div class="text-left">
										<span class="font-medium">{product.name}</span>
										<span class="ml-2 text-muted-foreground">{product.sku}</span>
									</div>
									<div class="flex items-center gap-3">
										<span class="text-muted-foreground">Stock: {product.stockQty}</span>
										<span class="font-medium">{formatCurrency(product.sellPrice, data.currencySymbol)}</span>
										<Plus class="h-4 w-4 text-primary" />
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Cart Items -->
			{#if cartItems.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title>Items ({cartItems.length})</Card.Title>
					</Card.Header>
					<Card.Content>
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Product</Table.Head>
									<Table.Head class="w-32 text-center">Qty</Table.Head>
									<Table.Head class="w-28 text-right">Price</Table.Head>
									<Table.Head class="w-24 text-center">Disc %</Table.Head>
									<Table.Head class="w-28 text-right">Total</Table.Head>
									<Table.Head class="w-12"></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each cartItems as item, i (item.productId)}
									{@const discount = item.unitPrice * item.quantity * (item.discountPct / 100)}
									{@const lineTotal = item.unitPrice * item.quantity - discount}
									<Table.Row>
										<Table.Cell>
											<div class="font-medium">{item.name}</div>
											<div class="text-xs text-muted-foreground">{item.sku}</div>
										</Table.Cell>
										<Table.Cell>
											<div class="flex items-center justify-center gap-1">
												<Button variant="outline" size="icon" class="h-7 w-7" type="button" onclick={() => updateQuantity(i, -1)}>
													<Minus class="h-3 w-3" />
												</Button>
												<span class="w-8 text-center text-sm">{item.quantity}</span>
												<Button variant="outline" size="icon" class="h-7 w-7" type="button" onclick={() => updateQuantity(i, 1)}>
													<Plus class="h-3 w-3" />
												</Button>
											</div>
										</Table.Cell>
										<Table.Cell class="text-right">
											{formatCurrency(item.unitPrice, data.currencySymbol)}
										</Table.Cell>
										<Table.Cell>
											<Input
												type="number"
												min="0"
												max="100"
												step="0.5"
												class="h-7 w-16 mx-auto text-center text-sm"
												bind:value={item.discountPct}
											/>
										</Table.Cell>
										<Table.Cell class="text-right font-medium">
											{formatCurrency(lineTotal, data.currencySymbol)}
										</Table.Cell>
										<Table.Cell>
											<Button variant="ghost" size="icon" class="h-7 w-7 text-destructive" type="button" onclick={() => removeItem(i)}>
												<Trash2 class="h-4 w-4" />
											</Button>
										</Table.Cell>
									</Table.Row>

									<!-- Hidden inputs for form submission -->
									<input type="hidden" name="items[{i}].productId" value={item.productId} />
									<input type="hidden" name="items[{i}].name" value={item.name} />
									<input type="hidden" name="items[{i}].sku" value={item.sku} />
									<input type="hidden" name="items[{i}].unitPrice" value={item.unitPrice} />
									<input type="hidden" name="items[{i}].quantity" value={item.quantity} />
									<input type="hidden" name="items[{i}].discountPct" value={item.discountPct} />
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>

		<!-- Right: Summary -->
		<div>
			<Card.Root class="sticky top-4">
				<Card.Header>
					<Card.Title>Quote Summary</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if cartItems.length === 0}
						<div class="flex flex-col items-center py-8 text-center text-muted-foreground">
							<ShoppingCart class="mb-2 h-10 w-10" />
							<p class="text-sm">Add products to build your quote</p>
						</div>
					{:else}
						<div class="flex justify-between text-sm">
							<span>Subtotal</span>
							<span>{formatCurrency(subtotal, data.currencySymbol)}</span>
						</div>
						{#if data.taxRate > 0}
							<div class="flex justify-between text-sm text-muted-foreground">
								<span>Tax ({data.taxRate}%)</span>
								<span>{formatCurrency(taxAmount, data.currencySymbol)}</span>
							</div>
						{/if}
						<Separator />
						<div class="flex justify-between text-lg font-bold">
							<span>Total</span>
							<span>{formatCurrency(totalAmount, data.currencySymbol)}</span>
						</div>

						<input type="hidden" name="subtotal" value={subtotal} />
						<input type="hidden" name="taxAmount" value={taxAmount} />
						<input type="hidden" name="totalAmount" value={totalAmount} />

						<Button type="submit" class="w-full mt-4" disabled={cartItems.length === 0}>
							Create Quotation
						</Button>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</form>
