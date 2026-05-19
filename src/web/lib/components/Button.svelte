<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
    type?: 'button' | 'submit';
    disabled?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'default',
    size = 'default',
    type = 'button',
    disabled = false,
    class: className = '',
    onclick,
    children,
  }: Props = $props();

  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white',
  };

  const sizeClasses = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-6 text-base',
  };
</script>

<button
  {type}
  {disabled}
  onclick={onclick}
  class="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:pointer-events-none disabled:opacity-50 {variantClasses[variant]} {sizeClasses[size]} {className}"
>
  {@render children()}
</button>
