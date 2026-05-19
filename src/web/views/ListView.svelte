<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card } from '../lib/components';
  import { getAppsState, fetchApps } from '../stores/apps.svelte';
  import type { AppEntry } from '../../domain/types';

  interface Props {
    onCreate: () => void;
    onRemove: (appName: string) => void;
  }

  let { onCreate, onRemove }: Props = $props();

  const state = getAppsState();

  onMount(() => {
    fetchApps();
  });

  function getIconUrl(app: AppEntry): string {
    const filename = app.iconPath.split(/[/\\]/).pop();
    return filename ? `/icons/${filename}` : '';
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-gray-100">Installed Apps</h2>
      <p class="text-sm text-gray-400">Manage your Windows Web Apps</p>
    </div>
    <Button onclick={onCreate}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      Create new app
    </Button>
  </div>

  {#if state.loading}
    <div class="flex items-center justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-blue-600"></div>
      <span class="ml-3 text-gray-400">Loading apps...</span>
    </div>
  {:else if state.error}
    <Card class="p-6 text-center">
      <div class="mb-2 text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </div>
      <p class="text-gray-300">{state.error}</p>
      <Button variant="outline" class="mt-4" onclick={() => fetchApps()}>Try again</Button>
    </Card>
  {:else if state.apps.length === 0}
    <Card class="p-8 text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-200">No apps installed</h3>
      <p class="mt-1 text-gray-400">Create your first Windows Web App to get started.</p>
      <Button class="mt-4" onclick={onCreate}>Create your first app</Button>
    </Card>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each state.apps as app (app.name)}
        <Card class="group overflow-hidden transition-all hover:border-gray-700">
          <div class="p-5">
            <div class="flex items-start gap-4">
              <img
                src={getIconUrl(app)}
                alt="{app.name} icon"
                class="h-12 w-12 rounded-lg object-cover"
                onerror={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'1.5\'%3E%3Crect width=\'18\' height=\'18\' x=\'3\' y=\'3\' rx=\'2\'/%3E%3Cpath d=\'M3 9h18\'/%3E%3Cpath d=\'M9 21V9\'/%3E%3C/svg%3E';
                }}
              />
              <div class="min-w-0 flex-1">
                <h3 class="truncate font-semibold text-gray-100">{app.name}</h3>
                <p class="truncate text-sm text-gray-400">{app.url}</p>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-3 text-xs text-gray-500">
              <span class="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/><line x1="10.88" x2="15.46" y1="21.94" y2="14"/></svg>
                {app.browser}
              </span>
              <span class="inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                {formatDate(app.createdAt)}
              </span>
            </div>
            <div class="mt-4 flex gap-2">
              <Button variant="outline" size="sm" class="flex-1" onclick={() => onRemove(app.name)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Remove
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
