<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency, formatDateTime, formatDate } from '$lib/utils';
	import {
		ArrowLeft,
		Save,
		Trash2,
		User,
		Mail,
		Phone,
		MapPin,
		ShoppingCart,
		FileText,
		Pencil,
		DollarSign,
		Calendar
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editing = $state(false);
	let submitting = $state(false);
	let deleting = $state(false);

	let editName = $state(data.customer.name);
	let editEmail = $state(data.customer.email ?? '');
	let editPhone = $state(data.customer.phone ?? '');
	let editAddress = $state(data.customer.address ?? '');
	let editNotes = $state(data.customer.notes ?? '');

	function startEdit() {
		editName = data.customer.name;
		editEmail = data.customer.email ?? '';
		editPhone = data.customer.phone ?? '';
		editAddress = data.customer.address ?? '';
		editNotes = data.customer.notes ?? '';
		editing = true;
	}

	function cancelEdit() {
		editing = false;
	}
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="outline" size="icon" href="/customers">
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h2 class="text-2xl font-bold tracking-tight">{data.customer.name}</h2>
				<p class="text-sm text-muted-foreground">Customer since {formatDate(data.customer.createdAt)}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if !editing}
				<Button variant="outline" onclick={startEdit}>
					<Pencil class="mr-2 h-4 w-4" />
					Edit
				</Button>
			{/if}
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					if (!confirm('Are you sure you want to delete this customer?')) {
						return ({ cancel }) => cancel();
					}
					deleting = true;
					return async ({ result, update }) => {
						deleting = false;
						if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to delete');
						}
						await update();
					};
				}}
			>
				<Button
					type="submit"
					variant="destructive"
					size="sm"
					disabled={deleting}
				>
					<Trash2 class="mr-2 h-4 w-4" />
					Delete
				</Button>
			</form>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<Card.Root>
			<Card.Content class="flex items-center gap-3 p-4">
				<div class="rounded-md bg-primary/10 p-2">
					<ShoppingCart class="h-5 w-5 text-primary" />
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Total Sales</p>
					<p class="text-xl font-bold">{data.sales.length}</p>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-3 p-4">
				<div class="rounded-md bg-primary/10 p-2">
					<DollarSign class="h-5 w-5 text-primary" />
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Total Spent</p>
					<p class="text-xl font-bold">{formatCurrency(data.totalSpent, data.settings?.currencySymbol)}</p>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-3 p-4">
				<div class="rounded-md bg-primary/10 p-2">
					<Calendar class="h-5 w-5 text-primary" />
				</div>
				<div>
					<p class="text-sm text-muted-foreground">Member Since</p>
					<p class="text-xl font-bold">{formatDate(data.customer.createdAt)}</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Customer Info / Edit Form -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-2">
				<User class="h-4 w-4" />
				<Card.Title class="text-sm">Customer Information</Card.Title>
			</div>
		</Card.Header>
		<Card.Content>
			{#if editing}
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						submitting = true;
						return async ({ result, update }) => {
							submitting = false;
							if (result.type === 'failure') {
								toast.error(result.data?.error as string || 'Failed to update');
							} else {
								toast.success('Customer updated');
								editing = false;
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					{#if form?.error}
						<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{form.error}
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="edit-name">Name *</Label>
						<Input id="edit-name" name="name" type="text" required bind:value={editName} />
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="edit-email">Email</Label>
							<Input id="edit-email" name="email" type="email" bind:value={editEmail} />
						</div>
						<div class="space-y-2">
							<Label for="edit-phone">Phone</Label>
							<Input id="edit-phone" name="phone" type="tel" bind:value={editPhone} />
						</div>
					</div>

					<div class="space-y-2">
						<Label for="edit-address">Address</Label>
						<Textarea id="edit-address" name="address" rows={2} class="resize-none" bind:value={editAddress} />
					</div>

					<div class="space-y-2">
						<Label for="edit-notes">Notes</Label>
						<Textarea id="edit-notes" name="notes" rows={3} class="resize-none" bind:value={editNotes} />
					</div>

					<div class="flex justify-end gap-2 pt-2">
						<Button variant="outline" type="button" onclick={cancelEdit}>Cancel</Button>
						<Button type="submit" disabled={submitting}>
							<Save class="mr-2 h-4 w-4" />
							{submitting ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</form>
			{:else}
				<div class="space-y-3 text-sm">
					<div class="flex items-center gap-3">
						<Mail class="h-4 w-4 text-muted-foreground" />
						<span>{data.customer.email ?? 'No email'}</span>
					</div>
					<div class="flex items-center gap-3">
						<Phone class="h-4 w-4 text-muted-foreground" />
						<span>{data.customer.phone ?? 'No phone'}</span>
					</div>
					<div class="flex items-center gap-3">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span>{data.customer.address ?? 'No address'}</span>
					</div>
					{#if data.customer.notes}
						<Separator />
						<div>
							<p class="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
							<p>{data.customer.notes}</p>
						</div>
					{/if}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Purchase History -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-2">
				<ShoppingCart class="h-4 w-4" />
				<Card.Title class="text-sm">Purchase History</Card.Title>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			{#if data.sales.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
					<FileText class="mb-2 h-10 w-10" />
					<p class="text-sm">No purchases yet</p>
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Invoice</Table.Head>
							<Table.Head>Date</Table.Head>
							<Table.Head class="text-center">Items</Table.Head>
							<Table.Head class="text-right">Total</Table.Head>
							<Table.Head>Payment</Table.Head>
							<Table.Head>Status</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.sales as sale (sale.id)}
							<Table.Row class="cursor-pointer hover:bg-muted/50" onclick={() => window.location.href = `/sales/history/${sale.id}`}>
								<Table.Cell>
									<a href="/sales/history/{sale.id}" class="font-medium text-primary hover:underline">
										{sale.invoiceNumber}
									</a>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">
									{formatDateTime(sale.createdAt)}
								</Table.Cell>
								<Table.Cell class="text-center">
									{sale.itemCount}
								</Table.Cell>
								<Table.Cell class="text-right font-medium">
									{formatCurrency(sale.totalAmount, data.settings?.currencySymbol)}
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">{sale.paymentMethod}</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={sale.status === 'completed' ? 'default' : 'destructive'}>
										{sale.status}
									</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
