<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { Save, Store, DollarSign, Receipt, User } from '@lucide/svelte';

	let { data, form } = $props();

	let shopName = $state(data.settings?.shopName ?? 'MaoPOS');
	let shopAddress = $state(data.settings?.shopAddress ?? '');
	let shopPhone = $state(data.settings?.shopPhone ?? '');
	let shopEmail = $state(data.settings?.shopEmail ?? '');
	let currency = $state(data.settings?.currency ?? 'USD');
	let currencySymbol = $state(data.settings?.currencySymbol ?? '$');
	let taxRate = $state(String(data.settings?.taxRate ?? 0));
	let receiptFooter = $state(data.settings?.receiptFooter ?? '');
	let operatorName = $state(data.settings?.operatorName ?? 'Admin');

	let saved = $derived(form?.success === true);
</script>

<PageHeader title="Settings" description="Configure your POS system" />

{#if saved}
	<div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
		Settings saved successfully.
	</div>
{/if}

<form method="POST" action="?/save" use:enhance>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Shop Information -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<Store class="h-5 w-5 text-muted-foreground" />
					<Card.Title>Shop Information</Card.Title>
				</div>
				<Card.Description>Basic details about your business</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="shopName">Shop Name</Label>
					<Input id="shopName" name="shopName" bind:value={shopName} placeholder="Your Shop Name" />
				</div>
				<div class="space-y-2">
					<Label for="shopAddress">Address</Label>
					<Textarea id="shopAddress" name="shopAddress" bind:value={shopAddress} placeholder="Shop address" rows={3} />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="shopPhone">Phone</Label>
						<Input id="shopPhone" name="shopPhone" bind:value={shopPhone} placeholder="+1 234 567 890" />
					</div>
					<div class="space-y-2">
						<Label for="shopEmail">Email</Label>
						<Input id="shopEmail" name="shopEmail" type="email" bind:value={shopEmail} placeholder="shop@example.com" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Currency & Tax -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<DollarSign class="h-5 w-5 text-muted-foreground" />
					<Card.Title>Currency & Tax</Card.Title>
				</div>
				<Card.Description>Financial settings and tax configuration</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="currency">Currency Code</Label>
						<Input id="currency" name="currency" bind:value={currency} placeholder="USD" />
					</div>
					<div class="space-y-2">
						<Label for="currencySymbol">Currency Symbol</Label>
						<Input id="currencySymbol" name="currencySymbol" bind:value={currencySymbol} placeholder="$" />
					</div>
				</div>
				<div class="space-y-2">
					<Label for="taxRate">Tax Rate (%)</Label>
					<Input id="taxRate" name="taxRate" type="number" step="0.01" min="0" max="100" bind:value={taxRate} placeholder="0" />
					<p class="text-xs text-muted-foreground">Set to 0 to disable tax calculations</p>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Receipt Settings -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<Receipt class="h-5 w-5 text-muted-foreground" />
					<Card.Title>Receipt</Card.Title>
				</div>
				<Card.Description>Customize receipt appearance</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="receiptFooter">Receipt Footer</Label>
					<Textarea
						id="receiptFooter"
						name="receiptFooter"
						bind:value={receiptFooter}
						placeholder="Thank you for your purchase!"
						rows={3}
					/>
					<p class="text-xs text-muted-foreground">Printed at the bottom of every receipt</p>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Operator -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<User class="h-5 w-5 text-muted-foreground" />
					<Card.Title>Operator</Card.Title>
				</div>
				<Card.Description>Current operator information</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="operatorName">Operator Name</Label>
					<Input id="operatorName" name="operatorName" bind:value={operatorName} placeholder="Admin" />
					<p class="text-xs text-muted-foreground">Name recorded on each sale transaction</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="mt-6 flex justify-end">
		<Button type="submit" size="lg">
			<Save class="mr-2 h-4 w-4" />
			Save Settings
		</Button>
	</div>
</form>
