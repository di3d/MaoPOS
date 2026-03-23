<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { formatCurrency, formatDate } from '$lib/utils';
	import { Plus, Eye, ShoppingCart, Trash2, Search, FileText } from '@lucide/svelte';

	let { data } = $props();

	let search = $state('');

	let filtered = $derived(
		data.quotations.filter(
			(q) =>
				q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
				(q.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
				(q.customerName ?? '').toLowerCase().includes(search.toLowerCase())
		)
	);

	const statusVariants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; class: string }> = {
		draft: { variant: 'secondary', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
		sent: { variant: 'secondary', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
		accepted: { variant: 'secondary', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
		expired: { variant: 'secondary', class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
		converted: { variant: 'secondary', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' }
	};

	function getStatusStyle(status: string) {
		return statusVariants[status] ?? statusVariants.draft;
	}
</script>

<div class="flex items-center justify-between mb-6">
	<PageHeader title="Quotations" description="Manage quotes and proposals" />
	<Button href="/quotations/new">
		<Plus class="mr-2 h-4 w-4" />
		New Quote
	</Button>
</div>

<div class="mb-4 flex items-center gap-2">
	<div class="relative flex-1 max-w-sm">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input placeholder="Search quotations..." class="pl-9" bind:value={search} />
	</div>
</div>

{#if filtered.length === 0}
	<div class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
		<FileText class="mb-4 h-12 w-12 text-muted-foreground" />
		<h3 class="text-lg font-semibold">No quotations found</h3>
		<p class="text-sm text-muted-foreground mb-4">
			{search ? 'Try a different search term.' : 'Create your first quotation to get started.'}
		</p>
		{#if !search}
			<Button href="/quotations/new">
				<Plus class="mr-2 h-4 w-4" />
				New Quote
			</Button>
		{/if}
	</div>
{:else}
	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Quote #</Table.Head>
					<Table.Head>Title</Table.Head>
					<Table.Head>Customer</Table.Head>
					<Table.Head class="text-right">Total</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Valid Until</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filtered as q (q.id)}
					{@const style = getStatusStyle(q.status)}
					<Table.Row>
						<Table.Cell class="font-medium">{q.quoteNumber}</Table.Cell>
						<Table.Cell>{q.title ?? '—'}</Table.Cell>
						<Table.Cell>{q.customerName ?? 'Walk-in'}</Table.Cell>
						<Table.Cell class="text-right font-medium">
							{formatCurrency(q.totalAmount, data.currencySymbol)}
						</Table.Cell>
						<Table.Cell>
							<Badge class={style.class}>
								{q.status.charAt(0).toUpperCase() + q.status.slice(1)}
							</Badge>
						</Table.Cell>
						<Table.Cell>{formatDate(q.validUntil)}</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex items-center justify-end gap-1">
								<Button variant="ghost" size="icon" href="/quotations/{q.id}" title="View">
									<Eye class="h-4 w-4" />
								</Button>
								{#if q.status !== 'converted'}
									<form method="POST" action="?/convertToSale" use:enhance>
										<input type="hidden" name="id" value={q.id} />
										<Button variant="ghost" size="icon" type="submit" title="Convert to Sale">
											<ShoppingCart class="h-4 w-4" />
										</Button>
									</form>
								{/if}
								<form
									method="POST"
									action="?/delete"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
										};
									}}
								>
									<input type="hidden" name="id" value={q.id} />
									<Button variant="ghost" size="icon" type="submit" title="Delete" class="text-destructive hover:text-destructive">
										<Trash2 class="h-4 w-4" />
									</Button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
