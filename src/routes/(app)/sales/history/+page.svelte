<script lang="ts">
	import type { PageData } from './$types';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { formatCurrency, formatDateTime } from '$lib/utils';
	import { Search, Receipt, FileText } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let search = $state('');

	let filteredSales = $derived(
		data.sales.filter(
			(s) =>
				s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
				(s.customerName ?? '').toLowerCase().includes(search.toLowerCase()) ||
				s.paymentMethod.toLowerCase().includes(search.toLowerCase())
		)
	);

	function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'completed':
				return 'default';
			case 'refunded':
				return 'destructive';
			case 'voided':
				return 'outline';
			default:
				return 'secondary';
		}
	}

	function paymentLabel(method: string): string {
		switch (method) {
			case 'cash':
				return 'Cash';
			case 'card':
				return 'Card';
			case 'transfer':
				return 'Transfer';
			default:
				return method;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Sales History</h2>
			<p class="text-muted-foreground">View all completed sales and transactions.</p>
		</div>
	</div>

	<!-- Search -->
	<div class="relative max-w-sm">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			type="text"
			placeholder="Search by invoice, customer, method..."
			class="pl-10"
			bind:value={search}
		/>
	</div>

	<!-- Table -->
	{#if filteredSales.length === 0}
		<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
			<Receipt class="mb-3 h-12 w-12" />
			<p class="text-lg font-medium">No sales found</p>
			<p class="text-sm">Sales will appear here once transactions are completed.</p>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Invoice #</Table.Head>
						<Table.Head>Date</Table.Head>
						<Table.Head>Customer</Table.Head>
						<Table.Head class="text-center">Items</Table.Head>
						<Table.Head class="text-right">Total</Table.Head>
						<Table.Head>Payment</Table.Head>
						<Table.Head>Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredSales as sale (sale.id)}
						<Table.Row class="cursor-pointer hover:bg-muted/50" onclick={() => window.location.href = `/sales/history/${sale.id}`}>
							<Table.Cell>
								<a href="/sales/history/{sale.id}" class="flex items-center gap-1.5 font-medium text-primary hover:underline">
									<FileText class="h-3.5 w-3.5" />
									{sale.invoiceNumber}
								</a>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{formatDateTime(sale.createdAt)}
							</Table.Cell>
							<Table.Cell>
								{sale.customerName ?? 'Walk-in'}
							</Table.Cell>
							<Table.Cell class="text-center">
								{sale.itemCount}
							</Table.Cell>
							<Table.Cell class="text-right font-medium">
								{formatCurrency(sale.totalAmount)}
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline">{paymentLabel(sale.paymentMethod)}</Badge>
							</Table.Cell>
							<Table.Cell>
								<Badge variant={statusVariant(sale.status)}>
									{sale.status}
								</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<p class="text-sm text-muted-foreground">
			Showing {filteredSales.length} of {data.sales.length} sales
		</p>
	{/if}
</div>
