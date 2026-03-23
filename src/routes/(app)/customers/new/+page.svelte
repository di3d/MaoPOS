<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import { ArrowLeft, Save, UserPlus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Button variant="outline" size="icon" href="/customers">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h2 class="text-2xl font-bold tracking-tight">New Customer</h2>
			<p class="text-sm text-muted-foreground">Add a new customer to your database.</p>
		</div>
	</div>

	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-2">
				<UserPlus class="h-4 w-4" />
				<Card.Title class="text-sm">Customer Information</Card.Title>
			</div>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to create customer');
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
					<Label for="name">Name *</Label>
					<Input
						id="name"
						name="name"
						type="text"
						placeholder="Customer name"
						required
						value={form?.name ?? ''}
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="email@example.com"
							value={form?.email ?? ''}
						/>
					</div>
					<div class="space-y-2">
						<Label for="phone">Phone</Label>
						<Input
							id="phone"
							name="phone"
							type="tel"
							placeholder="+1 (555) 000-0000"
							value={form?.phone ?? ''}
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="address">Address</Label>
					<Textarea
						id="address"
						name="address"
						placeholder="Street address, city, state, zip..."
						rows={2}
						class="resize-none"
						value={form?.address ?? ''}
					/>
				</div>

				<div class="space-y-2">
					<Label for="notes">Notes</Label>
					<Textarea
						id="notes"
						name="notes"
						placeholder="Any additional notes..."
						rows={3}
						class="resize-none"
						value={form?.notes ?? ''}
					/>
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Button variant="outline" href="/customers">Cancel</Button>
					<Button type="submit" disabled={submitting}>
						<Save class="mr-2 h-4 w-4" />
						{submitting ? 'Creating...' : 'Create Customer'}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
