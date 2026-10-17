<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const NAV = [
		{ href: '/', label: 'Overview' },
		{ href: '/analytics', label: 'Analytics' },
		{ href: '/users', label: 'Users' },
		{ href: '/creators', label: 'Creators' },
		{ href: '/content', label: 'Content' },
		{ href: '/moderation', label: 'Moderation' },
		{ href: '/payments', label: 'Payments' },
		{ href: '/subscriptions', label: 'Subscriptions' },
		{ href: '/ads', label: 'Ads & Monetization' },
		{ href: '/danger', label: 'Danger Zone' }
	];

	const COMING_SOON = ['AI Operations', 'Storage', 'Messaging', 'System', 'Settings'];
</script>

<div class="flex min-h-screen" data-density="admin">
	<aside class="w-56 shrink-0 border-r border-border bg-surface/50 px-3 py-4">
		<a href="/" class="block px-2 text-sm font-bold tracking-tight">
			<span class="text-link">Story</span>Galore
			<span class="text-xs font-normal text-foreground-muted"> Admin</span>
		</a>
		<nav class="mt-6 space-y-0.5">
			{#each NAV as item (item.href)}
				<a
					href={item.href}
					class="block rounded-md px-3 py-1.5 text-sm text-foreground-muted transition hover:bg-surface-elevated hover:text-foreground"
				>
					{item.label}
				</a>
			{/each}
		</nav>
		<p class="mt-6 px-3 text-xs uppercase tracking-widest text-foreground-muted/60">Coming soon</p>
		<nav class="mt-1 space-y-0.5">
			{#each COMING_SOON as label (label)}
				<span class="block rounded-md px-3 py-1.5 text-sm text-foreground-muted/40">{label}</span>
			{/each}
		</nav>
	</aside>
	<div class="min-w-0 flex-1">
		{@render children()}
	</div>
</div>
