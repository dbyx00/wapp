<script lang="ts">
  interface Props {
    value?: number;
    max?: number;
    class?: string;
  }

  let {
    value = 0,
    max = 100,
    class: className = '',
  }: Props = $props();

  const percentage = $derived(max > 0 ? (value / max) * 100 : 0);
</script>

<div class="h-2 w-full overflow-hidden rounded-full bg-gray-800 {className}">
  <div
    class="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
    style="width: {percentage}%"
  ></div>
</div>
