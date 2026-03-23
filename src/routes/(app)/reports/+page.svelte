<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency, formatDate } from '$lib/utils';
	import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, CalendarDays } from '@lucide/svelte';

	let { data } = $props();

	const cs = data.currencySymbol;
</script>

<PageHeader title="Reports" description="Sales analytics and business insights" />

<Tabs.Root value="summary">
	<Tabs.List>
		<Tabs.Trigger value="summary">Sales Summary</Tabs.Trigger>
		<Tabs.Trigger value="products">Top Products</Tabs.Trigger>
		<Tabs.Trigger value="daily">Daily Revenue</Tabs.Trigger>
		<Tabs.Trigger value="profit">Profit Margins</Tabs.Trigger>
	</Tabs.List>

	<!-- Sales Summary -->
	<Tabs.Content value="summary">
		<div class="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Today -->
			<Card.Root>
				<Card.Header>
					<Card.Description>Today</Card.Description>
					<Card.Title class="text-2xl">{formatCurrency(data.today.total, cs)}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<ShoppingCart class="h-4 w-4" />
						<span>{data.today.count} sale{data.today.count !== 1 ? 's' : ''}</span>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- This Week -->
			<Card.Root>
				<Card.Header>
					<Card.Description>This Week</Card.Description>
					<Card.Title class="text-2xl">{formatCurrency(data.week.total, cs)}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<ShoppingCart class="h-4 w-4" />
						<span>{data.week.count} sale{data.week.count !== 1 ? 's' : ''}</span>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- This Month -->
			<Card.Root>
				<Card.Header>
					<Card.Description>This Month</Card.Description>
					<Card.Title class="text-2xl">{formatCurrency(data.month.total, cs)}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<ShoppingCart class="h-4 w-4" />
						<span>{data.month.count} sale{data.month.count !== 1 ? 's' : ''}</span>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Average sale values -->
		<div class="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
			<Card.Root>
				<Card.Header>
					<Card.Description>Avg Sale (Today)</Card.Description>
					<Card.Title class="text-xl">
						{data.today.count > 0 ? formatCurrency(data.today.total / data.today.count, cs) : formatCurrency(0, cs)}
					</Card.Title>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Description>Avg Sale (Week)</Card.Description>
					<Card.Title class="text-xl">
						{data.week.count > 0 ? formatCurrency(data.week.total / data.week.count, cs) : formatCurrency(0, cs)}
					</Card.Title>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Description>Avg Sale (Month)</Card.Description>
					<Card.Title class="text-xl">
						{data.month.count > 0 ? formatCurrency(data.month.total / data.month.count, cs) : formatCurrency(0, cs)}
					</Card.Title>
				</Card.Header>
			</Card.Root>
		</div>
	</Tabs.Content>

	<!-- Top Products -->
	<Tabs.Content value="products">
		<Card.Root class="mt-4">
			<Card.Header>
				<Card.Title>Top 10 Products by Quantity Sold</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.topProducts.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						<Package class="mx-auto mb-2 h-10 w-10" />
						<p>No sales data yet</p>
					</div>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-12">#</Table.Head>
								<Table.Head>Product</Table.Head>
								<Table.Head class="text-right">Qty Sold</Table.Head>
								<Table.Head class="text-right">Revenue</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.topProducts as product, i (product.name)}
								<Table.Row>
									<Table.Cell class="font-medium text-muted-foreground">{i + 1}</Table.Cell>
									<Table.Cell>
										<div class="font-medium">{product.name}</div>
										<div class="text-xs text-muted-foreground">{product.sku}</div>
									</Table.Cell>
									<Table.Cell class="text-right">{product.totalQty}</Table.Cell>
									<Table.Cell class="text-right font-medium">
										{formatCurrency(product.totalRevenue, cs)}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</Tabs.Content>

	<!-- Daily Revenue -->
	<Tabs.Content value="daily">
		<Card.Root class="mt-4">
			<Card.Header>
				<Card.Title>Daily Sales - Last 30 Days</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.dailySales.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						<CalendarDays class="mx-auto mb-2 h-10 w-10" />
						<p>No sales data for this period</p>
					</div>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Date</Table.Head>
								<Table.Head class="text-right">Sales</Table.Head>
								<Table.Head class="text-right">Revenue</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.dailySales as day (day.date)}
								<Table.Row>
									<Table.Cell>{formatDate(day.date)}</Table.Cell>
									<Table.Cell class="text-right">{day.count}</Table.Cell>
									<Table.Cell class="text-right font-medium">
										{formatCurrency(day.total, cs)}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</Tabs.Content>

	<!-- Profit Margins -->
	<Tabs.Content value="profit">
		<div class="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
			<Card.Root>
				<Card.Header>
					<Card.Description>Total Revenue</Card.Description>
					<Card.Title class="text-2xl">{formatCurrency(data.profit.totalRevenue, cs)}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-1 text-sm text-muted-foreground">
						<DollarSign class="h-4 w-4" />
						<span>Sum of all line totals</span>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Description>Total Cost</Card.Description>
					<Card.Title class="text-2xl">{formatCurrency(data.profit.totalCost, cs)}</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-1 text-sm text-muted-foreground">
						<TrendingDown class="h-4 w-4" />
						<span>Sum of unit costs</span>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Description>Gross Profit</Card.Description>
					<Card.Title class="text-2xl {data.profit.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
						{formatCurrency(data.profit.grossProfit, cs)}
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-1 text-sm">
						<TrendingUp class="h-4 w-4" />
						<span>
							Margin: {data.profit.totalRevenue > 0
								? ((data.profit.grossProfit / data.profit.totalRevenue) * 100).toFixed(1)
								: '0.0'}%
						</span>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</Tabs.Content>
</Tabs.Root>
