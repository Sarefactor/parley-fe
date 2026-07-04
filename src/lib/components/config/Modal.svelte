<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    onclose,
    wide = false,
    tall = false,
    errors = [],
    children,
  }: {
    title: string;
    onclose: () => void;
    wide?: boolean;
    tall?: boolean;
    /** Validation errors shown in a read-only panel beside the modal. */
    errors?: string[];
    children: Snippet;
  } = $props();

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") onclose();
  }
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="overlay"
  onclick={(e) => {
    if (e.target === e.currentTarget) onclose();
  }}
>
  <div class="modal-row">
    <div
      class="modal"
      class:wide
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <button type="button" class="close" onclick={onclose} aria-label="Close"
          >×</button
        >
      </header>
      <div class="content" class:tall>
        {@render children()}
      </div>
    </div>
    {#if errors.length > 0}
      <aside class="error-panel" aria-label="Validation errors">
        <h3>Validation Errors</h3>
        <ul>
          {#each errors as error, i (i)}
            <li>{error}</li>
          {/each}
        </ul>
      </aside>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(2, 4, 8, 0.65);
  }

  /* Lets clicks in the gap between modal and error panel fall through to the overlay. */
  .modal-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    max-height: calc(100vh - 4rem);
    pointer-events: none;
  }

  .modal {
    width: min(480px, calc(100vw - 2rem));
    max-height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
    pointer-events: auto;
  }

  .modal.wide {
    width: min(640px, calc(100vw - 2rem));
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.1rem;
    border-bottom: 1px solid var(--accent-soft);
  }

  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .close {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 1.3rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.2rem;
  }

  .close:hover {
    color: var(--text);
  }

  .content {
    padding: 1rem 1.1rem;
    overflow-y: auto;
  }

  /* Extra room so in-field dropdowns (e.g. variable suggestions) aren't clipped. */
  .content.tall {
    min-height: 260px;
  }

  .error-panel {
    width: 280px;
    flex-shrink: 0;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    background: var(--bg-raised);
    border: 1px solid rgba(224, 120, 120, 0.45);
    border-radius: 10px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
    padding: 0.85rem 1.1rem;
    pointer-events: auto;
  }

  .error-panel h3 {
    margin: 0 0 0.6rem;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #e07878;
  }

  .error-panel ul {
    margin: 0;
    padding: 0 0 0 1.1rem;
  }

  .error-panel li {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }
</style>
