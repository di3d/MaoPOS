<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { formatDate } from '$lib/utils';
	import { Search, Plus, Users, Pencil, Trash2, Eye } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let deletingId = $state<number | null>(null);

	let filteredCustomers = $derived(
		data.customers.filter(
			(c) =>
				c.name.toLowerCase().includes(search.toLowerCase()) ||
				(c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
				(c.phone ?? '').toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Customers</h2>
			<p class="text-muted-foreground">Manage your customer database.</p>
		</div>
		<Button href="/customers/new">
			<Plus class="mr-2 h-4 w-4" />
			New Customer
		</Button>
	</div>

	<!-- Search -->
	<div class="relative max-w-sm">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			type="text"
			placeholder="Search by name, email, or phone..."
			class="pl-10"
			bind:value={search}
		/>
	</div>

	<!-- Table -->
	{#if filteredCustomers.length === 0}
		<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
			<Users class="mb-3 h-12 w-12" />
			<p class="text-lg font-medium">No customers found</p>
			<p class="text-sm">Add customers to track their purchases.</p>
			<Button href="/customers/new" class="mt-4" variant="outline">
				<Plus class="mr-2 h-4 w-4" />
				Add First Customer
			</Button>
		</div>
	{:else}
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Phone</Table.Head>
						<Table.Head class="text-center">Sales</Table.Head>
						<Table.Head>Joined</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredCustomers as customer (customer.id)}
						<Table.Row>
							<Table.Cell>
								<a href="/customers/{customer.id}" class="font-medium text-primary hover:underline">
									{customer.name}
								</a>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{customer.email ?? '-'}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{customer.phone ?? '-'}
							</Table.Cell>
							<Table.Cell class="text-center">
								<Badge variant="secondary">{customer.saleCount}</Badge>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{formatDate(customer.createdAt)}
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="icon" class="h-8 w-8" href="/customers/{customer.id}">
										<Eye class="h-3.5 w-3.5" />
									</Button>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											deletingId = customer.id;
											return async ({ result, update }) => {
												deletingId = null;
												if (result.type === 'failure') {
													toast.error(result.data?.error as string || 'Failed to delete');
												} else {
													toast.success('Customer deleted');
												}
												await update();
											};
										}}
									>
										<input type="hidden" name="id" value={customer.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-destructive hover:text-destructive"
											disabled={deletingId === customer.id}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</Button>
									</form>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<p class="text-sm text-muted-foreground">
			Showing {filteredCustomers.length} of {data.customers.length} customers
		</p>
	{/if}
</div>
