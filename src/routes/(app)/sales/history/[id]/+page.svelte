<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatCurrency, formatDateTime } from '$lib/utils';
	import {
		Printer,
		ArrowLeft,
		Receipt,
		CreditCard,
		Pencil,
		X,
		Save,
		Ban,
		Trash2,
		Plus
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let editing = $state(false);
	let confirmVoid = $state(false);

	interface EditItem {
		id: number | null;
		productId: number;
		productName: string;
		productSku: string;
		unitPrice: number;
		unitCost: number;
		quantity: number;
		discountPct: number;
	}

	let editItems: EditItem[] = $state([]);
	let editPaymentMethod = $state('');
	let editAmountTendered = $state(0);
	let editCustomerId = $state<number | null>(null);
	let editNotes = $state('');

	function startEditing() {
		editItems = data.items.map((item) => ({
			id: item.id,
			productId: item.productId ?? 0,
			productName: item.productName,
			productSku: item.productSku,
			unitPrice: item.unitPrice,
			unitCost: item.unitCost,
			quantity: item.quantity,
			discountPct: item.discountPct
		}));
		editPaymentMethod = data.sale.paymentMethod;
		editAmountTendered = data.sale.amountTendered ?? 0;
		editCustomerId = data.sale.customerId;
		editNotes = data.sale.notes ?? '';
		editing = true;
	}

	function cancelEditing() {
		editing = false;
		confirmVoid = false;
	}

	function removeItem(index: number) {
		editItems = editItems.filter((_, i) => i !== index);
	}

	function getLineTotal(item: EditItem): number {
		const disc = item.unitPrice * item.quantity * (item.discountPct / 100);
		return item.unitPrice * item.quantity - disc;
	}

	let editSubtotal = $derived(editItems.reduce((sum, item) => sum + getLineTotal(item), 0));
	let editTaxAmount = $derived(editSubtotal * (data.settings?.taxRate ?? 0));
	let editTotal = $derived(editSubtotal + editTaxAmount);

	function paymentLabel(method: string): string {
		switch (method) {
			case 'cash':
				return 'Cash';
			case 'card':
				return 'Card';
			case 'transfer':
				return 'Bank Transfer';
			default:
				return method;
		}
	}

	const isVoided = $derived(data.sale.status === 'voided');
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<!-- Print-only header with store name -->
	<div class="hidden print:block text-center mb-6">
		<h1 class="text-2xl font-bold">{data.settings?.shopName ?? 'MaoPOS'}</h1>
		{#if data.settings?.shopAddress}
			<p class="text-sm text-muted-foreground">{data.settings.shopAddress}</p>
		{/if}
		{#if data.settings?.shopPhone}
			<p class="text-sm text-muted-foreground">{data.settings.shopPhone}</p>
		{/if}
		<hr class="mt-3" />
	</div>

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="outline" size="icon" href="/sales/history" data-print-hide>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h2 class="text-2xl font-bold tracking-tight">{data.sale.invoiceNumber}</h2>
				<p class="text-sm text-muted-foreground">{formatDateTime(data.sale.createdAt)}</p>
			</div>
		</div>
		<div class="flex items-center gap-2" data-print-hide>
			<Badge variant={isVoided ? 'destructive' : 'default'}>
				{data.sale.status}
			</Badge>
			{#if !editing && !isVoided}
				<Button variant="outline" onclick={startEditing}>
					<Pencil class="mr-2 h-4 w-4" />
					Edit
				</Button>
			{/if}
			{#if editing}
				<Button variant="ghost" onclick={cancelEditing}>
					<X class="mr-2 h-4 w-4" />
					Cancel
				</Button>
			{/if}
			<Button variant="outline" onclick={() => window.print()}>
				<Printer class="mr-2 h-4 w-4" />
				Print
			</Button>
		</div>
	</div>

	{#if isVoided}
		<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
			This sale has been voided. Stock has been restored.
		</div>
	{/if}

	{#if editing}
		<!-- ═══════════ EDIT MODE ═══════════ -->
		<form
			method="POST"
			action="?/update"
			use:enhance={({ formData }) => {
				formData.set('items', JSON.stringify(editItems));
				formData.set('customerId', String(editCustomerId ?? ''));
				formData.set('paymentMethod', editPaymentMethod);
				formData.set('amountTendered', String(editAmountTendered));
				formData.set('notes', editNotes);
				return async ({ result }) => {
					if (result.type === 'success') {
						toast.success('Sale updated successfully');
						editing = false;
						await invalidateAll();
					} else {
						toast.error('Failed to update sale');
					}
				};
			}}
		>
			<!-- Payment & Customer Edit -->
			<Card.Root class="mb-6">
				<Card.Header>
					<Card.Title class="text-sm">Payment & Customer</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="paymentMethod" class="text-sm font-medium">Payment Method</label>
						<Select.Root type="single" bind:value={editPaymentMethod}>
							<Select.Trigger class="w-full">
								{paymentLabel(editPaymentMethod)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="cash">Cash</Select.Item>
								<Select.Item value="card">Card</Select.Item>
								<Select.Item value="transfer">Bank Transfer</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					{#if editPaymentMethod === 'cash'}
						<div class="space-y-2">
							<label for="amountTendered" class="text-sm font-medium">Amount Tendered</label>
							<Input type="number" step="0.01" min="0" bind:value={editAmountTendered} />
						</div>
					{/if}
					<div class="space-y-2">
						<label for="customer" class="text-sm font-medium">Customer</label>
						<Select.Root type="single" value={String(editCustomerId ?? '')} onValueChange={(v) => editCustomerId = v ? Number(v) : null}>
							<Select.Trigger class="w-full">
								{editCustomerId
									? data.customers?.find((c) => c.id === editCustomerId)?.name ?? 'Unknown'
									: 'Walk-in Customer'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Walk-in Customer</Select.Item>
								{#each data.customers ?? [] as customer (customer.id)}
									<Select.Item value={String(customer.id)}>{customer.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="space-y-2 sm:col-span-2">
						<label for="notes" class="text-sm font-medium">Notes</label>
						<Textarea bind:value={editNotes} placeholder="Optional notes..." />
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Editable Line Items -->
			<Card.Root class="mb-6">
				<Card.Header>
					<Card.Title class="text-sm">Line Items</Card.Title>
				</Card.Header>
				<Card.Content class="p-0">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>#</Table.Head>
								<Table.Head>Product</Table.Head>
								<Table.Head>SKU</Table.Head>
								<Table.Head class="text-right w-28">Price</Table.Head>
								<Table.Head class="text-center w-20">Qty</Table.Head>
								<Table.Head class="text-right w-24">Disc %</Table.Head>
								<Table.Head class="text-right">Total</Table.Head>
								<Table.Head class="w-12"></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each editItems as item, idx (idx)}
								<Table.Row>
									<Table.Cell class="text-muted-foreground">{idx + 1}</Table.Cell>
									<Table.Cell class="font-medium">{item.productName}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{item.productSku}</Table.Cell>
									<Table.Cell class="text-right">
										<Input
											type="number"
											step="0.01"
											min="0"
											class="h-8 w-24 text-right ml-auto"
											bind:value={item.unitPrice}
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<Input
											type="number"
											min="1"
											class="h-8 w-16 text-center mx-auto"
											bind:value={item.quantity}
										/>
									</Table.Cell>
									<Table.Cell class="text-right">
										<Input
											type="number"
											step="0.1"
											min="0"
											max="100"
											class="h-8 w-20 text-right ml-auto"
											bind:value={item.discountPct}
										/>
									</Table.Cell>
									<Table.Cell class="text-right font-medium">
										{formatCurrency(getLineTotal(item), data.settings?.currencySymbol)}
									</Table.Cell>
									<Table.Cell>
										{#if editItems.length > 1}
											<Button
												variant="ghost"
												size="icon-xs"
												onclick={() => removeItem(idx)}
												class="text-destructive"
											>
												<Trash2 class="h-3.5 w-3.5" />
											</Button>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>

			<!-- Edit Totals -->
			<Card.Root class="mb-6">
				<Card.Content class="p-4">
					<div class="ml-auto w-full max-w-xs space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Subtotal</span>
							<span>{formatCurrency(editSubtotal, data.settings?.currencySymbol)}</span>
						</div>
						{#if editTaxAmount > 0}
							<div class="flex justify-between">
								<span class="text-muted-foreground">Tax</span>
								<span>{formatCurrency(editTaxAmount, data.settings?.currencySymbol)}</span>
							</div>
						{/if}
						<Separator />
						<div class="flex justify-between text-lg font-bold">
							<span>Total</span>
							<span>{formatCurrency(editTotal, data.settings?.currencySymbol)}</span>
						</div>
						{#if editPaymentMethod === 'cash' && editAmountTendered > 0}
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Change</span>
								<span>{formatCurrency(editAmountTendered - editTotal, data.settings?.currencySymbol)}</span>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<div class="flex justify-end gap-2">
				<Button variant="ghost" onclick={cancelEditing}>Cancel</Button>
				<Button type="submit">
					<Save class="mr-2 h-4 w-4" />
					Save Changes
				</Button>
			</div>
		</form>
	{:else}
		<!-- ═══════════ VIEW MODE ═══════════ -->
		<div class="grid gap-6 md:grid-cols-2 print:grid-cols-2">
			<!-- Sale Info -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<Receipt class="h-4 w-4" />
						<Card.Title class="text-sm">Sale Details</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Invoice Number</span>
						<span class="font-medium">{data.sale.invoiceNumber}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Date</span>
						<span>{formatDateTime(data.sale.createdAt)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Operator</span>
						<span>{data.sale.createdBy}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Status</span>
						<Badge variant={isVoided ? 'destructive' : 'default'}>
							{data.sale.status}
						</Badge>
					</div>
					{#if data.sale.notes}
						<div class="pt-1">
							<span class="text-muted-foreground">Notes</span>
							<p class="mt-0.5">{data.sale.notes}</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Payment & Customer Info -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<CreditCard class="h-4 w-4" />
						<Card.Title class="text-sm">Payment & Customer</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Payment Method</span>
						<Badge variant="outline">{paymentLabel(data.sale.paymentMethod)}</Badge>
					</div>
					{#if data.sale.paymentMethod === 'cash'}
						<div class="flex justify-between">
							<span class="text-muted-foreground">Amount Tendered</span>
							<span>{formatCurrency(data.sale.amountTendered ?? 0, data.settings?.currencySymbol)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Change Given</span>
							<span>{formatCurrency(data.sale.changeGiven ?? 0, data.settings?.currencySymbol)}</span>
						</div>
					{/if}
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Customer</span>
						<span>
							{#if data.customer}
								<a href="/customers/{data.customer.id}" class="font-medium text-primary hover:underline">
									{data.customer.name}
								</a>
							{:else}
								Walk-in Customer
							{/if}
						</span>
					</div>
					{#if data.customer?.email}
						<div class="flex justify-between">
							<span class="text-muted-foreground">Email</span>
							<span>{data.customer.email}</span>
						</div>
					{/if}
					{#if data.customer?.phone}
						<div class="flex justify-between">
							<span class="text-muted-foreground">Phone</span>
							<span>{data.customer.phone}</span>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Line Items -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-sm">Line Items</Card.Title>
			</Card.Header>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>#</Table.Head>
							<Table.Head>Product</Table.Head>
							<Table.Head>SKU</Table.Head>
							<Table.Head class="text-right">Price</Table.Head>
							<Table.Head class="text-center">Qty</Table.Head>
							<Table.Head class="text-right">Discount</Table.Head>
							<Table.Head class="text-right">Total</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as item, idx (item.id)}
							<Table.Row>
								<Table.Cell class="text-muted-foreground">{idx + 1}</Table.Cell>
								<Table.Cell class="font-medium">{item.productName}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{item.productSku}</Table.Cell>
								<Table.Cell class="text-right">
									{formatCurrency(item.unitPrice, data.settings?.currencySymbol)}
								</Table.Cell>
								<Table.Cell class="text-center">{item.quantity}</Table.Cell>
								<Table.Cell class="text-right">
									{#if item.discountPct > 0}
										<Badge variant="secondary">{item.discountPct}%</Badge>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right font-medium">
									{formatCurrency(item.lineTotal, data.settings?.currencySymbol)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<!-- Totals -->
		<Card.Root>
			<Card.Content class="p-4">
				<div class="ml-auto w-full max-w-xs space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Subtotal</span>
						<span>{formatCurrency(data.sale.subtotal, data.settings?.currencySymbol)}</span>
					</div>
					{#if data.sale.discountAmount > 0}
						<div class="flex justify-between text-destructive">
							<span>Discount</span>
							<span>-{formatCurrency(data.sale.discountAmount, data.settings?.currencySymbol)}</span>
						</div>
					{/if}
					{#if data.sale.taxAmount > 0}
						<div class="flex justify-between">
							<span class="text-muted-foreground">Tax</span>
							<span>{formatCurrency(data.sale.taxAmount, data.settings?.currencySymbol)}</span>
						</div>
					{/if}
					<Separator />
					<div class="flex justify-between text-lg font-bold">
						<span>Total</span>
						<span>{formatCurrency(data.sale.totalAmount, data.settings?.currencySymbol)}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Void Sale Button -->
		{#if !isVoided}
			<div class="flex justify-end" data-print-hide>
				{#if confirmVoid}
					<div class="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
						<span class="text-sm text-destructive">Void this sale? Stock will be restored.</span>
						<form
							method="POST"
							action="?/void"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										toast.success('Sale voided');
										confirmVoid = false;
										await invalidateAll();
									} else {
										toast.error('Failed to void sale');
									}
								};
							}}
						>
							<Button type="submit" variant="destructive" size="sm">
								Yes, Void
							</Button>
						</form>
						<Button variant="ghost" size="sm" onclick={() => (confirmVoid = false)}>
							No, Keep
						</Button>
					</div>
				{:else}
					<Button variant="outline" class="text-destructive" onclick={() => (confirmVoid = true)}>
						<Ban class="mr-2 h-4 w-4" />
						Void Sale
					</Button>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Receipt Footer -->
	{#if data.settings?.receiptFooter}
		<p class="text-center text-sm text-muted-foreground print:block">
			{data.settings.receiptFooter}
		</p>
	{/if}
</div>
