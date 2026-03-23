<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sheet from '$lib/components/ui/sheet';
	import {
		LayoutDashboard,
		ShoppingCart,
		FileText,
		Monitor,
		Package,
		Users,
		History,
		BarChart3,
		ClipboardList,
		Settings,
		Menu,
		Clock,
		Sun,
		Moon
	} from '@lucide/svelte';
	import { toggleMode, mode } from 'mode-watcher';

	let { children, data } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/sales/new', label: 'New Sale', icon: ShoppingCart },
		{ href: '/quotations', label: 'Quotations', icon: FileText },
		{ href: '/pc-builder', label: 'PC Builder', icon: Monitor },
		{ href: '/products', label: 'Products', icon: Package },
		{ href: '/customers', label: 'Customers', icon: Users },
		{ href: '/sales/history', label: 'Sales History', icon: History },
		{ href: '/reports', label: 'Reports', icon: BarChart3 },
		{ href: '/stock-take', label: 'Stock Take', icon: ClipboardList }
	];

	const settingsItem = { href: '/settings', label: 'Settings', icon: Settings };

	let currentTime = $state('');
	let currentDate = $state('');
	let mobileOpen = $state(false);

	function isActive(href: string, currentPath: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath.startsWith(href);
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		});
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getPageTitle(path: string): string {
		if (path === '/') return 'Dashboard';
		const item = navItems.find((n) => isActive(n.href, path));
		if (item) return item.label;
		if (isActive(settingsItem.href, path)) return settingsItem.label;
		return 'MaoPOS';
	}

	$effect(() => {
		const now = new Date();
		currentTime = formatTime(now);
		currentDate = formatDate(now);

		const interval = setInterval(() => {
			const d = new Date();
			currentTime = formatTime(d);
			currentDate = formatDate(d);
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="flex h-screen overflow-hidden bg-background">
	<!-- Desktop Sidebar -->
	<aside class="hidden w-60 flex-col border-r bg-card lg:flex">
		<!-- Branding -->
		<div class="flex h-14 items-center gap-2 border-b px-4">
			<Monitor class="h-6 w-6 text-primary" />
			<span class="text-lg font-bold tracking-tight">MaoPOS</span>
		</div>

		<!-- Navigation -->
		<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
			{#each navItems as item (item.href)}
				{@const active = isActive(item.href, $page.url.pathname)}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
						{active
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<item.icon class="h-4 w-4" />
					{item.label}
				</a>
			{/each}

			<div class="mt-auto">
				<Separator class="my-2" />
				<a
					href={settingsItem.href}
					class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
						{isActive(settingsItem.href, $page.url.pathname)
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<Settings class="h-4 w-4" />
					Settings
				</a>
			</div>
		</nav>

		<!-- Version -->
		<div class="border-t px-4 py-2">
			<p class="text-xs text-muted-foreground">v1.0.0</p>
		</div>
	</aside>

	<!-- Mobile Sidebar (Sheet) -->
	<Sheet.Root bind:open={mobileOpen}>
		<Sheet.Content side="left" class="w-60 p-0">
			<Sheet.Header class="flex h-14 flex-row items-center gap-2 border-b px-4">
				<Monitor class="h-6 w-6 text-primary" />
				<Sheet.Title class="text-lg font-bold tracking-tight">MaoPOS</Sheet.Title>
			</Sheet.Header>

			<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
				{#each navItems as item (item.href)}
					{@const active = isActive(item.href, $page.url.pathname)}
					<a
						href={item.href}
						onclick={() => (mobileOpen = false)}
						class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
							{active
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<item.icon class="h-4 w-4" />
						{item.label}
					</a>
				{/each}

				<div class="mt-auto">
					<Separator class="my-2" />
					<a
						href={settingsItem.href}
						onclick={() => (mobileOpen = false)}
						class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
							{isActive(settingsItem.href, $page.url.pathname)
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<Settings class="h-4 w-4" />
						Settings
					</a>
				</div>
			</nav>

			<div class="border-t px-4 py-2">
				<p class="text-xs text-muted-foreground">v1.0.0</p>
			</div>
		</Sheet.Content>
	</Sheet.Root>

	<!-- Main Content Area -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Top Header Bar -->
		<header class="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
			<div class="flex items-center gap-3">
				<!-- Mobile menu trigger -->
				<Button
					variant="ghost"
					size="icon"
					class="lg:hidden"
					onclick={() => (mobileOpen = true)}
				>
					<Menu class="h-5 w-5" />
					<span class="sr-only">Toggle menu</span>
				</Button>

				<h1 class="text-lg font-semibold">{getPageTitle($page.url.pathname)}</h1>
			</div>

			<div class="flex items-center gap-3 text-sm text-muted-foreground">
				<Clock class="h-4 w-4" />
				<span class="hidden sm:inline">{currentDate}</span>
				<span class="font-medium text-foreground">{currentTime}</span>

				<Button variant="ghost" size="icon" onclick={toggleMode} class="ml-1">
					{#if $mode === 'dark'}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
					<span class="sr-only">Toggle theme</span>
				</Button>
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto p-4 lg:p-6">
			{@render children()}
		</main>
	</div>
</div>
