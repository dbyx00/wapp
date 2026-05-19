<script lang="ts">
  import ListView from './views/ListView.svelte';
  import CreateView from './views/CreateView.svelte';
  import RemoveView from './views/RemoveView.svelte';

  let currentView = $state<'list' | 'create' | 'remove'>('list');
  let selectedAppName = $state('');

  function switchToList() {
    currentView = 'list';
    selectedAppName = '';
  }

  function switchToCreate() {
    currentView = 'create';
  }

  function switchToRemove(appName: string) {
    selectedAppName = appName;
    currentView = 'remove';
  }
</script>

<main class="min-h-screen bg-[#0a0a0a] text-gray-100">
  <header class="border-b border-gray-800 bg-[#111] px-6 py-4">
    <div class="mx-auto flex max-w-5xl items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </div>
        <h1 class="text-xl font-bold tracking-tight">WApp Manager</h1>
      </div>
      {#if currentView !== 'list'}
        <button
          onclick={switchToList}
          class="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to list
        </button>
      {/if}
    </div>
  </header>

  <div class="mx-auto max-w-5xl p-6">
    {#if currentView === 'list'}
      <ListView onCreate={switchToCreate} onRemove={switchToRemove} />
    {:else if currentView === 'create'}
      <CreateView onCancel={switchToList} onSuccess={switchToList} />
    {:else if currentView === 'remove'}
      <RemoveView appName={selectedAppName} onCancel={switchToList} onSuccess={switchToList} />
    {/if}
  </div>
</main>
