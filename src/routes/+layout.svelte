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
							href="https://ewels.github.io/pocket-money/"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
						>
							Docs
							<svg
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
								/>
							</svg>
						</a>
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
							<a
								href="https://ewels.github.io/pocket-money/"
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
								onclick={() => (mobileMenuOpen = false)}
							>
								Docs
								<svg
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
									/>
								</svg>
							</a>
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

		<!-- Footer -->
		<footer class="border-t border-gray-200 bg-gray-50 py-6">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
					<p class="text-sm text-gray-500">
						Built by <a
							href="https://phil.ewels.co.uk"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-600 hover:text-blue-800">Phil Ewels</a
						>
					</p>
					<div class="flex items-center gap-4 text-sm text-gray-500">
						<a
							href="https://github.com/ewels/pocket-money"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 hover:text-gray-700"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									fill-rule="evenodd"
									d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
									clip-rule="evenodd"
								/>
							</svg>
							Open source
						</a>
					</div>
				</div>
			</div>
		</footer>
	</div>
{:else}
	{@render children()}
{/if}
