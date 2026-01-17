<script lang="ts">
  import { enhance } from '$app/forms';

  let { show = false, error = '' }: { show: boolean; error?: string } = $props();

  let pin = $state('');
  let loading = $state(false);

  function handleKeyPress(digit: string) {
    if (pin.length < 6) {
      pin += digit;
    }
  }

  function handleBackspace() {
    pin = pin.slice(0, -1);
  }

  function handleClear() {
    pin = '';
  }
</script>

{#if show}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900">
    <div class="w-full max-w-sm p-4">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-white">Pocket Money</h1>
        <p class="mt-2 text-gray-400">Enter PIN to continue</p>
      </div>

      {#if error}
        <div class="mb-4 rounded-md bg-red-500/10 p-4 border border-red-500/20">
          <p class="text-sm text-red-400 text-center">{error}</p>
        </div>
      {/if}

      <div class="flex justify-center gap-3 mb-8">
        {#each Array(6) as _, i}
          <div
            class="h-4 w-4 rounded-full transition-colors {i < pin.length
              ? 'bg-blue-500'
              : 'bg-gray-700'}"
          ></div>
        {/each}
      </div>

      <form method="POST" action="/pin" use:enhance>
        <input type="hidden" name="pin" value={pin} />

        <div class="grid grid-cols-3 gap-3 mb-6">
          {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
            <button
              type="button"
              class="h-16 rounded-xl bg-gray-800 text-2xl font-medium text-white hover:bg-gray-700 active:bg-gray-600 transition-colors"
              onclick={() => handleKeyPress(digit)}
            >
              {digit}
            </button>
          {/each}
          <button
            type="button"
            class="h-16 rounded-xl bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 active:bg-gray-600 transition-colors"
            onclick={handleClear}
          >
            Clear
          </button>
          <button
            type="button"
            class="h-16 rounded-xl bg-gray-800 text-2xl font-medium text-white hover:bg-gray-700 active:bg-gray-600 transition-colors"
            onclick={() => handleKeyPress('0')}
          >
            0
          </button>
          <button
            type="button"
            class="h-16 rounded-xl bg-gray-800 text-xl font-medium text-gray-400 hover:bg-gray-700 active:bg-gray-600 transition-colors"
            onclick={handleBackspace}
          >
            <svg class="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
            </svg>
          </button>
        </div>

        <button
          type="submit"
          class="w-full h-14 rounded-xl bg-blue-600 text-lg font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={pin.length < 4 || loading}
        >
          {loading ? 'Verifying...' : 'Unlock'}
        </button>
      </form>
    </div>
  </div>
{/if}
