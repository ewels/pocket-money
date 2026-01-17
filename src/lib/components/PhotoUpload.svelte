<script lang="ts">
  let { name }: { name: string } = $props();

  let fileInput: HTMLInputElement;
  let hiddenInput: HTMLInputElement;
  let preview = $state<string | null>(null);
  let processing = $state(false);

  const MAX_SIZE = 256; // Max dimension in pixels
  const QUALITY = 0.8; // JPEG quality

  async function resizeAndCompress(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    processing = true;

    try {
      const dataUrl = await resizeAndCompress(file);
      preview = dataUrl;
      // Store the processed data URL in a hidden input for form submission
      hiddenInput.value = dataUrl;
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Failed to process image. Please try again.');
    } finally {
      processing = false;
    }
  }
</script>

<div class="flex items-center gap-4">
  {#if preview}
    <img src={preview} alt="Preview" class="h-16 w-16 rounded-full object-cover" />
  {/if}
  <div>
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      class="hidden"
      onchange={handleFileChange}
    />
    <input
      bind:this={hiddenInput}
      type="hidden"
      {name}
    />
    <button
      type="button"
      class="btn-secondary text-sm"
      onclick={() => fileInput.click()}
      disabled={processing}
    >
      {#if processing}
        <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Processing...
      {:else}
        <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Upload Photo
      {/if}
    </button>
    <p class="mt-1 text-xs text-gray-500">Images will be resized to 256x256</p>
  </div>
</div>
