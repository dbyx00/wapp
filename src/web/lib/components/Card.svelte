<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div class="rounded-xl border border-gray-800 bg-[#111] text-gray-100 shadow-sm {className}">
  {@render children()}
</div>
