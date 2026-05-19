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
  class="flex h-10 w-full rounded-lg border border-gray-700 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-100 placeholder-gray-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50 {className}"
/>
