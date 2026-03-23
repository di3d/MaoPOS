<script lang="ts">
	import type { PageData } from './$types';
	import StatsCard from '$lib/components/app/StatsCard.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { formatCurrency, formatDateTime } from '$lib/utils';
	import {
		Package,
		AlertTriangle,
		Users,
		DollarSign,
		Monitor,
		ShoppingCart,
		FileText,
		Plus,
		BarChart3
	} from '@lucide/svelte';

	let { data } = $props<{ data: PageData }>();
</script>

<div class="space-y-6">
	<!-- Welcome Message -->
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Welcome back!</h2>
		<p class="text-muted-foreground">Here's an overview of your store today.</p>
	</div>

	<!-- Stats Cards Row -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
		<StatsCard
			title="Total Products"
			value={data.totalProducts}
			icon={Package}
			color="blue"
		/>
		<StatsCard
			title="Low Stock Alert"
			value={data.lowStockCount}
			icon={AlertTriangle}
			color="red"
			subtitle={data.lowStockCount > 0 ? 'Items need restocking' : 'All stocked up'}
		/>
		<StatsCard
			title="Total Customers"
			value={data.totalCustomers}
			icon={Users}
			color="green"
		/>
		<StatsCard
			title="Today's Sales"
			value={formatCurrency(data.todaySalesTotal, data.currencySymbol)}
			icon={DollarSign}
			color="orange"
			subtitle="{data.todaySalesCount} transaction{data.todaySalesCount !== 1 ? 's' : ''}"
		/>
		<StatsCard
			title="PC Builds"
			value={data.buildCount}
			icon={Monitor}
			color="purple"
		/>
	</div>

	<!-- Quick Actions -->
	<div>
		<h3 class="mb-3 text-lg font-semibold">Quick Actions</h3>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			<a
				href="/sales/new"
				class="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
			>
				<ShoppingCart class="h-4 w-4" />
				New Sale
			</a>
			<a
				href="/quotations"
				class="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
			>
				<FileText class="h-4 w-4" />
				New Quote
			</a>
			<a
				href="/pc-builder"
				class="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
			>
				<Monitor class="h-4 w-4" />
				PC Builder
			</a>
			<a
				href="/products/new"
				class="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
			>
				<Plus class="h-4 w-4" />
				Add Product
			</a>
			<a
				href="/reports"
				class="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
			>
				<BarChart3 class="h-4 w-4" />
				View Reports
			</a>
		</div>
	</div>

	<!-- Two-column: Recent Sales + Low Stock -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent Sales -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Recent Sales</Card.Title>
				<Card.Description>Latest transactions</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.recentSales.length === 0}
					<p class="py-4 text-center text-sm text-muted-foreground">No sales yet today.</p>
				{:else}
					<div class="space-y-3">
						{#each data.recentSales as sale (sale.id)}
							<div class="flex items-center justify-between rounded-md border px-3 py-2">
								<div>
									<p class="text-sm font-medium">{sale.invoiceNumber}</p>
									<p class="text-xs text-muted-foreground">{formatDateTime(sale.createdAt)}</p>
								</div>
								<span class="text-sm font-semibold">
									{formatCurrency(sale.totalAmount, data.currencySymbol)}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Low Stock Items -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Low Stock Items</Card.Title>
				<Card.Description>Products that need restocking</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.lowStockProducts.length === 0}
					<p class="py-4 text-center text-sm text-muted-foreground">All products are well stocked.</p>
				{:else}
					<div class="space-y-3">
						{#each data.lowStockProducts as product (product.id)}
							<div class="flex items-center justify-between rounded-md border px-3 py-2">
								<div>
									<p class="text-sm font-medium">{product.name}</p>
									<p class="text-xs text-muted-foreground">Min stock: {product.lowStockThreshold}</p>
								</div>
								<Badge variant={product.stockQty === 0 ? 'destructive' : 'outline'} class={product.stockQty === 0 ? '' : 'border-orange-400 text-orange-600 dark:text-orange-400'}>
									<AlertTriangle class="mr-1 h-3 w-3" />
									{product.stockQty} left
								</Badge>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
