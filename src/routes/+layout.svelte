<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<title>MaoPOS</title>
</svelte:head>

<ModeWatcher />
{@render children()}
<Toaster />
