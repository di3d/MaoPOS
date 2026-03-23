<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency, formatDate } from '$lib/utils';
	import { ArrowLeft, ShoppingCart, Printer } from '@lucide/svelte';

	let { data } = $props();

	const q = data.quotation;

	const statusStyles: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
		sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
		accepted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
		expired: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
		converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
	};

	const canConvert = ['draft', 'sent', 'accepted'].includes(q.status);
</script>

<div class="flex items-center justify-between mb-6">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/quotations">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{q.quoteNumber}</h1>
			{#if q.title}
				<p class="text-muted-foreground">{q.title}</p>
			{/if}
		</div>
	</div>
	<div class="flex items-center gap-2">
		{#if canConvert}
			<form method="POST" action="?/convertToSale" use:enhance>
				<Button type="submit" variant="default">
					<ShoppingCart class="mr-2 h-4 w-4" />
					Convert to Sale
				</Button>
			</form>
		{/if}
		<Button variant="outline" onclick={() => window.print()}>
			<Printer class="mr-2 h-4 w-4" />
			Print
		</Button>
	</div>
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Main content -->
	<div class="lg:col-span-2 space-y-6">
		<!-- Items -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Quotation Items</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Product</Table.Head>
							<Table.Head class="text-center">Qty</Table.Head>
							<Table.Head class="text-right">Unit Price</Table.Head>
							<Table.Head class="text-center">Discount</Table.Head>
							<Table.Head class="text-right">Total</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as item (item.id)}
							<Table.Row>
								<Table.Cell>
									<div class="font-medium">{item.productName}</div>
									<div class="text-xs text-muted-foreground">{item.productSku}</div>
								</Table.Cell>
								<Table.Cell class="text-center">{item.quantity}</Table.Cell>
								<Table.Cell class="text-right">
									{formatCurrency(item.unitPrice, data.currencySymbol)}
								</Table.Cell>
								<Table.Cell class="text-center">
									{item.discountPct > 0 ? `${item.discountPct}%` : '—'}
								</Table.Cell>
								<Table.Cell class="text-right font-medium">
									{formatCurrency(item.lineTotal, data.currencySymbol)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Sidebar -->
	<div class="space-y-6">
		<!-- Summary -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Summary</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="flex justify-between text-sm">
					<span>Status</span>
					<Badge class={statusStyles[q.status] ?? ''}>
						{q.status.charAt(0).toUpperCase() + q.status.slice(1)}
					</Badge>
				</div>
				<Separator />
				<div class="flex justify-between text-sm">
					<span>Subtotal</span>
					<span>{formatCurrency(q.subtotal, data.currencySymbol)}</span>
				</div>
				{#if q.taxAmount > 0}
					<div class="flex justify-between text-sm text-muted-foreground">
						<span>Tax</span>
						<span>{formatCurrency(q.taxAmount, data.currencySymbol)}</span>
					</div>
				{/if}
				{#if q.discountAmount > 0}
					<div class="flex justify-between text-sm text-muted-foreground">
						<span>Discount</span>
						<span>-{formatCurrency(q.discountAmount, data.currencySymbol)}</span>
					</div>
				{/if}
				<Separator />
				<div class="flex justify-between text-lg font-bold">
					<span>Total</span>
					<span>{formatCurrency(q.totalAmount, data.currencySymbol)}</span>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Details -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Details</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Customer</span>
					<span>{q.customerName ?? 'Walk-in'}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Created</span>
					<span>{formatDate(q.createdAt)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Valid Until</span>
					<span>{formatDate(q.validUntil)}</span>
				</div>
				{#if q.notes}
					<Separator />
					<div class="text-sm">
						<span class="text-muted-foreground">Notes</span>
						<p class="mt-1">{q.notes}</p>
					</div>
				{/if}
				{#if q.convertedToSaleId}
					<Separator />
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Sale</span>
						<a href="/sales/history" class="text-primary underline">View Sale</a>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
