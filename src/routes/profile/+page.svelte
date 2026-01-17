<script lang="ts">
  import { enhance } from '$app/forms';
  import { getInitials } from '$lib/utils';
  import PhotoUpload from '$lib/components/PhotoUpload.svelte';

  let { data, form } = $props();

  let loading = $state(false);
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Profile</h1>

  {#if form?.error}
    <div class="rounded-md bg-red-50 p-4">
      <p class="text-sm text-red-700">{form.error}</p>
    </div>
  {/if}

  {#if form?.success}
    <div class="rounded-md bg-green-50 p-4">
      <p class="text-sm text-green-700">{form.success}</p>
    </div>
  {/if}

  <div class="card p-6">
    <form
      method="POST"
      action="?/updateProfile"
      enctype="multipart/form-data"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          await update();
        };
      }}
      class="space-y-6"
    >
      <!-- Photo -->
      <div class="flex items-center gap-6">
        {#if data.user?.photo_data}
          <img
            src={data.user.photo_data}
            alt={data.user.name}
            class="h-24 w-24 rounded-full object-cover"
          />
        {:else}
          <div class="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
            {getInitials(data.user?.name ?? '')}
          </div>
        {/if}
        <PhotoUpload name="photo" />
      </div>

      <!-- Name -->
      <div>
        <label for="name" class="label">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          class="input"
          value={data.user?.name ?? ''}
        />
        <p class="mt-1 text-sm text-gray-500">This name appears in transaction history.</p>
      </div>

      <!-- Email (read-only) -->
      <div>
        <label for="email" class="label">Email</label>
        <input
          id="email"
          type="email"
          class="input bg-gray-50"
          value={data.user?.email ?? ''}
          disabled
        />
      </div>

      <div class="pt-4">
        <button type="submit" class="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  </div>
</div>
