<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { Component } from 'svelte';

	let {
		title,
		value,
		subtitle,
		icon: Icon,
		color = 'blue'
	}: {
		title: string;
		value: string | number;
		subtitle?: string;
		icon?: Component<{ class?: string }>;
		color?: 'blue' | 'red' | 'green' | 'orange' | 'purple';
	} = $props();

	const colorClasses: Record<string, { border: string; icon: string; bg: string }> = {
		blue: {
			border: 'border-l-blue-500',
			icon: 'text-blue-500',
			bg: 'bg-blue-50 dark:bg-blue-950/30'
		},
		red: {
			border: 'border-l-red-500',
			icon: 'text-red-500',
			bg: 'bg-red-50 dark:bg-red-950/30'
		},
		green: {
			border: 'border-l-green-500',
			icon: 'text-green-500',
			bg: 'bg-green-50 dark:bg-green-950/30'
		},
		orange: {
			border: 'border-l-orange-500',
			icon: 'text-orange-500',
			bg: 'bg-orange-50 dark:bg-orange-950/30'
		},
		purple: {
			border: 'border-l-purple-500',
			icon: 'text-purple-500',
			bg: 'bg-purple-50 dark:bg-purple-950/30'
		}
	};

	let styles = $derived(colorClasses[color] ?? colorClasses.blue);
</script>

<Card.Root class="border-l-4 {styles.border}">
	<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
		<Card.Title class="text-sm font-medium text-muted-foreground">{title}</Card.Title>
		{#if Icon}
			<div class="rounded-md p-2 {styles.bg}">
				<Icon class="h-4 w-4 {styles.icon}" />
			</div>
		{/if}
	</Card.Header>
	<Card.Content>
		<div class="text-2xl font-bold">{value}</div>
		{#if subtitle}
			<p class="mt-1 text-xs text-muted-foreground">{subtitle}</p>
		{/if}
	</Card.Content>
</Card.Root>
