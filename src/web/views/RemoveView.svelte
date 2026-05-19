<script lang="ts">
  import { Button, Card } from '../lib/components';
  import { removeApp as apiRemoveApp } from '../api/client';
  import { removeAppFromStore } from '../stores/apps.svelte';
  import type { AppEvent } from '../../domain/events';
  import type { AppEntry } from '../../domain/types';

  interface Props {
    appName: string;
    onCancel: () => void;
    onSuccess: () => void;
  }

  let { appName, onCancel, onSuccess }: Props = $props();

  let isSubmitting = $state(false);
  let events = $state<AppEvent[]>([]);
  let completed = $state(false);
  let success = $state(false);
  let resultApp = $state<AppEntry | undefined>(undefined);
  let errorMessage = $state('');

  const stepLabels: Record<string, string> = {
    'finding-app': 'Finding app',
    'deleting-shortcut': 'Deleting shortcut',
    'deleting-icon': 'Deleting icon',
    'updating-registry': 'Updating registry',
    removed: 'App removed',
  };

  function getStepStatus(step: string): string | null {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].step === step) return events[i].status;
    }
    return null;
  }

  function isStepVisible(step: string): boolean {
    return events.some(e => e.step === step);
  }

  function getStepError(step: string): string | undefined {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].step === step) return events[i].error;
    }
    return undefined;
  }

  function statusIcon(status: string | null): string | null {
    if (status === 'start') return 'spinner';
    if (status === 'success') return 'check';
    if (status === 'error') return 'cross';
    if (status === 'warning') return 'warning';
    return null;
  }

  async function handleRemove() {
    isSubmitting = true;
    events = [];
    completed = false;
    success = false;
    resultApp = undefined;
    errorMessage = '';

    await apiRemoveApp(
      appName,
      (event) => {
        events = [...events, event];
      },
      (didSucceed, result, error) => {
        completed = true;
        success = didSucceed;
        resultApp = result;
        errorMessage = error || '';
        isSubmitting = false;
        if (didSucceed) {
          removeAppFromStore(appName);
        }
      }
    );
  }
</script>

<div class="mx-auto max-w-xl space-y-6">
  <div>
    <h2 class="text-2xl font-bold tracking-tight text-gray-100">Remove App</h2>
    <p class="text-sm text-gray-400">Confirm removal of the selected app</p>
  </div>

  {#if !completed}
    <Card class="p-6">
      <div class="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 p-4">
        <div class="flex items-start gap-3">
          <svg class="mt-0.5 shrink-0 text-red-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          <div>
            <p class="font-medium text-red-300">Are you sure you want to remove <span class="font-bold">{appName}</span>?</p>
            <p class="mt-1 text-sm text-gray-400">This will delete the shortcut, icon, and registry entry. This action cannot be undone.</p>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <Button variant="destructive" disabled={isSubmitting} onclick={handleRemove}>
          {#if isSubmitting}
            <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
          {/if}
          Remove App
        </Button>
        <Button variant="outline" onclick={onCancel} disabled={isSubmitting}>Cancel</Button>
      </div>
    </Card>

    {#if events.length > 0}
      <Card class="p-6">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Progress</h3>
        <div class="space-y-3">
          {#each Object.entries(stepLabels) as [step, label]}
            {#if isStepVisible(step)}
              {@const status = getStepStatus(step)}
              {@const stepError = getStepError(step)}
              <div class="flex items-center gap-3">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center">
                  {#if statusIcon(status) === 'spinner'}
                    <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/30 border-t-blue-600"></div>
                  {:else if statusIcon(status) === 'check'}
                    <svg class="text-green-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {:else if statusIcon(status) === 'cross'}
                    <svg class="text-red-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                  {:else if statusIcon(status) === 'warning'}
                    <svg class="text-yellow-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                  {:else}
                    <div class="h-4 w-4 rounded-full border-2 border-gray-700"></div>
                  {/if}
                </div>
                <span class="text-sm text-gray-300">{label}</span>
                {#if stepError}
                  <span class="ml-auto text-xs text-red-400">{stepError}</span>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </Card>
    {/if}
  {:else}
    <Card class="p-6 text-center">
      {#if success}
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
          <svg class="text-green-400" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-100">App Removed Successfully</h3>
        {#if resultApp}
          <p class="mt-1 text-gray-400">{resultApp.name} has been uninstalled.</p>
        {:else}
          <p class="mt-1 text-gray-400">{appName} has been uninstalled.</p>
        {/if}
        <Button class="mt-4" onclick={onSuccess}>Back to list</Button>
      {:else}
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
          <svg class="text-red-400" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-100">Removal Failed</h3>
        {#if errorMessage}
          <p class="mt-1 text-gray-400">{errorMessage}</p>
        {/if}
        <div class="mt-4 flex justify-center gap-3">
          <Button onclick={() => { completed = false; events = []; }}>Try Again</Button>
          <Button variant="outline" onclick={onCancel}>Back to list</Button>
        </div>
      {/if}
    </Card>
  {/if}
</div>