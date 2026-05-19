<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    children: Snippet;
    footer?: Snippet;
  }

  let {
    open = $bindable(false),
    title = '',
    children,
    footer,
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-sm"
      onclick={() => (open = false)}
      role="presentation"
    ></div>
    <div class="relative z-10 w-full max-w-md rounded-xl border border-gray-800 bg-[#111] p-6 shadow-xl">
      {#if title}
        <h2 class="mb-4 text-lg font-semibold text-gray-100">{title}</h2>
      {/if}
      <div class="text-gray-300">
        {@render children()}
      </div>
      {#if footer}
        <div class="mt-6 flex justify-end gap-3">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
