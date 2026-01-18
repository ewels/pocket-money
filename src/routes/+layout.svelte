<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { getInitials } from '$lib/utils';

	let { data, children } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: 'home' },
		{ href: '/settings', label: 'Settings', icon: 'settings' }
	];

	let mobileMenuOpen = $state(false);

	const isPinPage = $derived($page.url.pathname === '/pin');
</script>

<svelte:head>
	<title>Pocket Money</title>
</svelte:head>

{#if data.user && !isPinPage}
	<div class="min-h-full">
		<!-- Navigation -->
		<nav class="bg-white shadow-sm border-b border-gray-200">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 justify-between">
					<div class="flex">
						<div class="flex flex-shrink-0 items-center">
							<a href="/" class="flex items-center gap-2 text-xl font-bold text-blue-600">
								<img src="/icons/icon.svg" alt="" class="h-8 w-8" />
								<span>Pocket Money</span>
							</a>
						</div>
						<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
							{#each navItems as item}
								<a
									href={item.href}
									class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium {$page
										.url.pathname === item.href
										? 'border-blue-500 text-gray-900'
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
								>
									{item.label}
								</a>
							{/each}
						</div>
					</div>

					<div class="hidden sm:ml-6 sm:flex sm:items-center">
						<a
							href="/profile"
							class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							{#if data.user.photo_data}
								<img
									src={data.user.photo_data}
									alt={data.user.name}
									class="h-8 w-8 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600"
								>
									{getInitials(data.user.name)}
								</div>
							{/if}
							<span>{data.user.name}</span>
						</a>
						<form method="POST" action="/login?/logout" class="ml-2">
							<button
								type="submit"
								class="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							>
								Logout
							</button>
						</form>
					</div>

					<!-- Mobile menu button -->
					<div class="flex items-center sm:hidden">
						<button
							type="button"
							class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
							onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						>
							<span class="sr-only">Open main menu</span>
							<svg
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								{#if mobileMenuOpen}
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								{:else}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
									/>
								{/if}
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Mobile menu -->
			{#if mobileMenuOpen}
				<div class="sm:hidden">
					<div class="space-y-1 pb-3 pt-2">
						{#each navItems as item}
							<a
								href={item.href}
								class="block border-l-4 py-2 pl-3 pr-4 text-base font-medium {$page.url.pathname ===
								item.href
									? 'border-blue-500 bg-blue-50 text-blue-700'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'}"
								onclick={() => (mobileMenuOpen = false)}
							>
								{item.label}
							</a>
						{/each}
					</div>
					<div class="border-t border-gray-200 pb-3 pt-4">
						<a
							href="/profile"
							class="flex items-center px-4"
							onclick={() => (mobileMenuOpen = false)}
						>
							{#if data.user.photo_data}
								<img
									src={data.user.photo_data}
									alt={data.user.name}
									class="h-10 w-10 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600"
								>
									{getInitials(data.user.name)}
								</div>
							{/if}
							<div class="ml-3">
								<div class="text-base font-medium text-gray-800">{data.user.name}</div>
								<div class="text-sm text-gray-500">{data.user.email}</div>
							</div>
						</a>
						<div class="mt-3 space-y-1 px-2">
							<form method="POST" action="/login?/logout">
								<button
									type="submit"
									class="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
								>
									Logout
								</button>
							</form>
						</div>
					</div>
				</div>
			{/if}
		</nav>

		<main class="py-6">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>
	</div>
{:else}
	{@render children()}
{/if}
