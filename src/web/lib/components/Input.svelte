<script lang="ts">
  interface Props {
    type?: string;
    placeholder?: string;
    value?: string;
    class?: string;
    required?: boolean;
  }

  let {
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    class: className = '',
    required = false,
  }: Props = $props();
</script>

<input
  {type}
  {placeholder}
  {required}
  bind:value
  class="flex h-11 w-full rounded-lg border border-gray-700 bg-[#111] px-4 py-2.5 text-sm text-gray-100 shadow-sm transition-colors placeholder:text-gray-500 hover:border-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50 {className}"
/>