<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<header class="titlebar">
	<img src="/parley-logo.png" alt="Parley logo" class="logo" />
	<span class="title">Parley</span>
</header>

<main>
	{@render children()}
</main>

<style>
	.titlebar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		height: var(--titlebar-height);
		padding: 0 0.75rem;
		background: var(--bg-titlebar);
		border-bottom: 1px solid transparent;
		border-image: linear-gradient(
				90deg,
				var(--accent-soft),
				rgba(79, 143, 230, 0.08) 60%,
				transparent
			)
			1;
	}

	.logo {
		height: 32px;
		width: auto;
	}

	.title {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--text);
	}

	main {
		min-height: calc(100vh - var(--titlebar-height));
	}
</style>
