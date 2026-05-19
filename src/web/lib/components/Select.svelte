<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options: Option[];
    value?: string;
    class?: string;
    required?: boolean;
  }

  let {
    options,
    value = $bindable(''),
    class: className = '',
    required = false,
  }: Props = $props();
</script>

<div class="relative">
  <select
    bind:value
    {required}
    class="flex h-11 w-full appearance-none rounded-lg border border-gray-700 bg-[#111] px-4 py-2.5 pr-10 text-sm text-gray-100 shadow-sm transition-colors hover:border-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50 {className}"
  >
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
    <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
    </svg>
  </div>
</div>