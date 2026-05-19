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

<select
  bind:value
  {required}
  class="flex h-10 w-full rounded-lg border border-gray-700 bg-[#0a0a0a] px-3 py-2 text-sm text-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50 {className}"
>
  {#each options as option}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
