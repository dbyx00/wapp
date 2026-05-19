<script lang="ts">
  import { Button, Card, Input, Select } from '../lib/components';
  import { createApp as apiCreateApp } from '../api/client';
  import { addApp } from '../stores/apps.svelte';
  import { AppEvent } from '../../domain/events';
  import type { AppEntry } from '../../domain/types';

  interface Props {
    onCancel: () => void;
    onSuccess: () => void;
  }

  let { onCancel, onSuccess }: Props = $props();

  let url = $state('');
  let name = $state('');
  let browser = $state('brave');
  let isSubmitting = $state(false);
  let events = $state<AppEvent[]>([]);
  let completed = $state(false);
  let success = $state(false);
  let resultApp = $state<AppEntry | undefined>(undefined);
  let errorMessage = $state('');

  const browserOptions = [
    { value: 'brave', label: 'Brave' },
    { value: 'chrome', label: 'Chrome' },
    { value: 'edge', label: 'Edge' },
  ];

  const stepLabels: Record<string, string> = {
    validating: 'Validating URL',
    'resolving-browser': 'Resolving browser',
    'resolving-name': 'Resolving app name',
    'downloading-icon': 'Downloading icon',
    'creating-shortcut': 'Creating shortcut',
    registering: 'Registering app',
    created: 'App created',
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

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!url.trim()) return;

    isSubmitting = true;
    events = [];
    completed = false;
    success = false;
    resultApp = undefined;
    errorMessage = '';

    await apiCreateApp(
      url.trim(),
      name.trim() || undefined,
      browser,
      (event) => {
        events = [...events, event];
      },
      (didSucceed, result, error) => {
        completed = true;
        success = didSucceed;
        resultApp = result;
        errorMessage = error || '';
        isSubmitting = false;
        if (didSucceed && result) {
          addApp(result);
        }
      }
    );
  }
</script>

<div class="mx-auto max-w-xl space-y-6">
  <div>
    <h2 class="text-2xl font-bold tracking-tight text-gray-100">Create New App</h2>
    <p class="text-sm text-gray-400">Enter a URL to create a Windows Web App</p>
  </div>

  {#if !completed}
    <Card class="p-6">
      <form onsubmit={handleSubmit} class="space-y-4">
        <div class="space-y-2">
          <label for="url" class="text-sm font-medium text-gray-300">URL *</label>
          <Input id="url" type="url" placeholder="https://example.com" bind:value={url} required />
        </div>
        <div class="space-y-2">
          <label for="name" class="text-sm font-medium text-gray-300">App Name</label>
          <Input id="name" type="text" placeholder="My App (optional)" bind:value={name} />
        </div>
        <div class="space-y-2">
          <label for="browser" class="text-sm font-medium text-gray-300">Browser</label>
          <Select id="browser" options={browserOptions} bind:value={browser} />
        </div>
        <div class="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            {/if}
            Create App
          </Button>
          <Button variant="outline" type="button" onclick={onCancel}>Cancel</Button>
        </div>
      </form>
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
        <h3 class="text-lg font-semibold text-gray-100">App Created Successfully</h3>
        {#if resultApp}
          <p class="mt-1 text-gray-400">{resultApp.name} — {resultApp.url}</p>
        {/if}
        <Button class="mt-4" onclick={onSuccess}>Back to list</Button>
      {:else}
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
          <svg class="text-red-400" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-100">Creation Failed</h3>
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
