<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency } from '$lib/utils';
	import { ShoppingCart, Plus, Minus, Trash2, Search, Package, CreditCard, Banknote, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	type CartItem = {
		productId: number;
		name: string;
		sku: string;
		unitPrice: number;
		unitCost: number;
		quantity: number;
		discountPct: number;
	};

	let cart = $state<CartItem[]>([]);
	let search = $state('');
	let customerId = $state<string>('');
	let paymentMethod = $state<string>('cash');
	let amountTendered = $state(0);
	let notes = $state('');
	let submitting = $state(false);

	let filteredProducts = $derived(
		data.products.filter(
			(p) =>
				p.name.toLowerCase().includes(search.toLowerCase()) ||
				p.sku.toLowerCase().includes(search.toLowerCase())
		)
	);

	let subtotal = $derived(
		cart.reduce((sum, item) => {
			const disc = item.unitPrice * item.quantity * (item.discountPct / 100);
			return sum + (item.unitPrice * item.quantity - disc);
		}, 0)
	);

	let taxRate = $derived(data.settings?.taxRate ?? 0);
	let taxAmount = $derived(subtotal * taxRate);
	let total = $derived(subtotal + taxAmount);
	let change = $derived(paymentMethod === 'cash' ? amountTendered - total : 0);
	let cartCount = $derived(cart.reduce((sum, item) => sum + item.quantity, 0));

	function addToCart(product: (typeof data.products)[0]) {
		if (product.stockQty <= 0) {
			toast.error('Out of stock');
			return;
		}
		const existing = cart.find((c) => c.productId === product.id);
		if (existing) {
			if (existing.quantity >= product.stockQty) {
				toast.error('Not enough stock');
				return;
			}
			existing.quantity++;
		} else {
			cart.push({
				productId: product.id,
				name: product.name,
				sku: product.sku,
				unitPrice: product.sellPrice,
				unitCost: product.costPrice,
				quantity: 1,
				discountPct: 0
			});
		}
		cart = [...cart];
	}

	function removeFromCart(productId: number) {
		cart = cart.filter((c) => c.productId !== productId);
	}

	function updateQty(productId: number, delta: number) {
		const item = cart.find((c) => c.productId === productId);
		if (!item) return;
		const product = data.products.find((p) => p.id === productId);
		const newQty = item.quantity + delta;
		if (newQty <= 0) {
			removeFromCart(productId);
			return;
		}
		if (product && newQty > product.stockQty) {
			toast.error('Not enough stock');
			return;
		}
		item.quantity = newQty;
		cart = [...cart];
	}

	function updateDiscount(productId: number, value: string) {
		const item = cart.find((c) => c.productId === productId);
		if (!item) return;
		const pct = Math.min(100, Math.max(0, Number(value) || 0));
		item.discountPct = pct;
		cart = [...cart];
	}

	function clearCart() {
		cart = [];
		customerId = '';
		paymentMethod = 'cash';
		amountTendered = 0;
		notes = '';
	}

	function getLineTotal(item: CartItem): number {
		const disc = item.unitPrice * item.quantity * (item.discountPct / 100);
		return item.unitPrice * item.quantity - disc;
	}
</script>

<div class="flex h-[calc(100vh-7rem)] gap-4">
	<!-- Left Panel: Products -->
	<div class="flex flex-1 flex-col gap-4 overflow-hidden lg:flex-[2]">
		<!-- Search Bar -->
		<div class="relative">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search products by name or SKU..."
				class="pl-10"
				bind:value={search}
			/>
		</div>

		<!-- Product Grid -->
		<div class="flex-1 overflow-y-auto">
			{#if filteredProducts.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-muted-foreground">
					<Package class="mb-2 h-12 w-12" />
					<p>No products found</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{#each filteredProducts as product (product.id)}
						<button
							type="button"
							class="flex flex-col rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
							disabled={product.stockQty <= 0}
							onclick={() => addToCart(product)}
						>
							<span class="truncate text-sm font-medium">{product.name}</span>
							<span class="mt-0.5 text-xs text-muted-foreground">{product.sku}</span>
							<div class="mt-auto flex items-center justify-between pt-2">
								<span class="text-sm font-semibold text-primary">
									{formatCurrency(product.sellPrice, data.settings?.currencySymbol)}
								</span>
								<Badge variant={product.stockQty <= (product.lowStockThreshold ?? 5) ? 'destructive' : 'secondary'} class="text-xs">
									{product.stockQty}
								</Badge>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Right Panel: Cart -->
	<Card.Root class="flex w-full flex-col overflow-hidden lg:w-[400px] xl:w-[440px]">
		<Card.Header class="flex-row items-center justify-between space-y-0 pb-3">
			<div class="flex items-center gap-2">
				<ShoppingCart class="h-5 w-5" />
				<Card.Title class="text-base">Cart</Card.Title>
				{#if cartCount > 0}
					<Badge variant="secondary">{cartCount} items</Badge>
				{/if}
			</div>
			{#if cart.length > 0}
				<Button variant="ghost" size="sm" onclick={clearCart}>
					<X class="mr-1 h-3 w-3" />
					Clear
				</Button>
			{/if}
		</Card.Header>

		<Separator />

		<!-- Cart Items -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if cart.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-muted-foreground">
					<ShoppingCart class="mb-2 h-10 w-10" />
					<p class="text-sm">Cart is empty</p>
					<p class="text-xs">Click on products to add them</p>
				</div>
			{:else}
				<div class="flex flex-col gap-3">
					{#each cart as item (item.productId)}
						<div class="rounded-md border p-3">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{item.name}</p>
									<p class="text-xs text-muted-foreground">{item.sku}</p>
									<p class="text-xs text-muted-foreground">
										{formatCurrency(item.unitPrice, data.settings?.currencySymbol)} each
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									class="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
									onclick={() => removeFromCart(item.productId)}
								>
									<Trash2 class="h-3.5 w-3.5" />
								</Button>
							</div>

							<div class="mt-2 flex items-center justify-between">
								<div class="flex items-center gap-1">
									<Button
										variant="outline"
										size="icon"
										class="h-7 w-7"
										onclick={() => updateQty(item.productId, -1)}
									>
										<Minus class="h-3 w-3" />
									</Button>
									<span class="w-8 text-center text-sm font-medium">{item.quantity}</span>
									<Button
										variant="outline"
										size="icon"
										class="h-7 w-7"
										onclick={() => updateQty(item.productId, 1)}
									>
										<Plus class="h-3 w-3" />
									</Button>
								</div>

								<div class="flex items-center gap-1">
									<Input
										type="number"
										min="0"
										max="100"
										class="h-7 w-14 text-center text-xs"
										placeholder="0"
										value={item.discountPct || ''}
										oninput={(e) => updateDiscount(item.productId, (e.target as HTMLInputElement).value)}
									/>
									<span class="text-xs text-muted-foreground">%</span>
								</div>

								<span class="text-sm font-semibold">
									{formatCurrency(getLineTotal(item), data.settings?.currencySymbol)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Cart Footer: Totals & Payment -->
		<div class="border-t bg-muted/30 p-4">
			<!-- Totals -->
			<div class="mb-3 space-y-1 text-sm">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Subtotal</span>
					<span>{formatCurrency(subtotal, data.settings?.currencySymbol)}</span>
				</div>
				{#if taxRate > 0}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Tax ({(taxRate * 100).toFixed(1)}%)</span>
						<span>{formatCurrency(taxAmount, data.settings?.currencySymbol)}</span>
					</div>
				{/if}
				<Separator />
				<div class="flex justify-between text-base font-bold">
					<span>Total</span>
					<span>{formatCurrency(total, data.settings?.currencySymbol)}</span>
				</div>
			</div>

			<!-- Payment Options -->
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update, result }) => {
						submitting = false;
						if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to complete sale');
						}
						await update();
					};
				}}
				class="space-y-3"
			>
				<input type="hidden" name="cart" value={JSON.stringify(cart)} />
				<input type="hidden" name="customerId" value={customerId} />
				<input type="hidden" name="paymentMethod" value={paymentMethod} />
				<input type="hidden" name="amountTendered" value={amountTendered} />
				<input type="hidden" name="notes" value={notes} />

				<!-- Customer Select -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground" for="customer-select">Customer (optional)</label>
					<Select.Root type="single" bind:value={customerId}>
						<Select.Trigger class="w-full" id="customer-select">
							{#if customerId}
								{data.customers.find((c) => String(c.id) === customerId)?.name ?? 'Select customer'}
							{:else}
								<span class="text-muted-foreground">Walk-in customer</span>
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">Walk-in customer</Select.Item>
							{#each data.customers as customer (customer.id)}
								<Select.Item value={String(customer.id)}>{customer.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Payment Method -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground" for="payment-select">Payment Method</label>
					<Select.Root type="single" bind:value={paymentMethod}>
						<Select.Trigger class="w-full" id="payment-select">
							<div class="flex items-center gap-2">
								{#if paymentMethod === 'cash'}
									<Banknote class="h-4 w-4" />
									Cash
								{:else if paymentMethod === 'card'}
									<CreditCard class="h-4 w-4" />
									Card
								{:else}
									Other
								{/if}
							</div>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="cash">Cash</Select.Item>
							<Select.Item value="card">Card</Select.Item>
							<Select.Item value="transfer">Bank Transfer</Select.Item>
							<Select.Item value="other">Other</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Amount Tendered (cash only) -->
				{#if paymentMethod === 'cash'}
					<div>
						<label class="mb-1 block text-xs font-medium text-muted-foreground" for="amount-tendered">Amount Tendered</label>
						<Input
							id="amount-tendered"
							type="number"
							step="0.01"
							min="0"
							placeholder="0.00"
							bind:value={amountTendered}
						/>
					</div>

					{#if amountTendered > 0 && amountTendered >= total}
						<div class="flex justify-between rounded-md bg-green-500/10 p-2 text-sm font-semibold text-green-600 dark:text-green-400">
							<span>Change</span>
							<span>{formatCurrency(change, data.settings?.currencySymbol)}</span>
						</div>
					{:else if amountTendered > 0 && amountTendered < total}
						<div class="flex justify-between rounded-md bg-destructive/10 p-2 text-sm font-semibold text-destructive">
							<span>Insufficient</span>
							<span>-{formatCurrency(total - amountTendered, data.settings?.currencySymbol)}</span>
						</div>
					{/if}
				{/if}

				<!-- Notes -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground" for="sale-notes">Notes</label>
					<Textarea
						id="sale-notes"
						placeholder="Optional notes..."
						rows={2}
						class="resize-none"
						bind:value={notes}
					/>
				</div>

				<!-- Complete Sale Button -->
				<Button
					type="submit"
					class="w-full"
					size="lg"
					disabled={cart.length === 0 || submitting || (paymentMethod === 'cash' && amountTendered < total)}
				>
					{#if submitting}
						Processing...
					{:else}
						Complete Sale - {formatCurrency(total, data.settings?.currencySymbol)}
					{/if}
				</Button>
			</form>
		</div>
	</Card.Root>
</div>
