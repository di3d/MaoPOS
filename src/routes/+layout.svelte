<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<svelte:head>
	<title>MaoPOS - PC POS System</title>
</svelte:head>

{@render children()}
<Toaster />
