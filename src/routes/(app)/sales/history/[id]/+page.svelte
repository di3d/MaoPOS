<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency, formatDateTime } from '$lib/utils';
	import { Printer, ArrowLeft, Receipt, User, CreditCard } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

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
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<!-- Print-only header with store name -->
	<div class="hidden print:block text-center mb-6">
		<h1 class="text-2xl font-bold">{data.settings?.businessName ?? 'MaoPOS'}</h1>
		{#if data.settings?.businessAddress}
			<p class="text-sm text-muted-foreground">{data.settings.businessAddress}</p>
		{/if}
		{#if data.settings?.businessPhone}
			<p class="text-sm text-muted-foreground">{data.settings.businessPhone}</p>
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
		<div class="flex items-center gap-2">
			<Badge variant={data.sale.status === 'completed' ? 'default' : 'destructive'}>
				{data.sale.status}
			</Badge>
			<Button variant="outline" onclick={() => window.print()} data-print-hide>
				<Printer class="mr-2 h-4 w-4" />
				Print
			</Button>
		</div>
	</div>

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
					<Badge variant={data.sale.status === 'completed' ? 'default' : 'destructive'}>
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

	<!-- Receipt Footer -->
	{#if data.settings?.receiptFooter}
		<p class="text-center text-sm text-muted-foreground print:block">
			{data.settings.receiptFooter}
		</p>
	{/if}
</div>
