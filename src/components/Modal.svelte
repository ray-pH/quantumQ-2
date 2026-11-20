<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    dismiss,
    children,
    actions,
  }: {
    title: string;
    dismiss: () => void;
    children?: Snippet;
    actions: Snippet;
  } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    dialog.showModal();
    return () => dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="dialog-title"
  oncancel={(event) => {
    event.preventDefault();
    dismiss();
  }}
>
  <h2 id="dialog-title">{title}</h2>
  {#if children}
    <div class="content">{@render children()}</div>
  {/if}
  <div class="actions">{@render actions()}</div>
</dialog>

<style>
  dialog {
    border: 1px solid var(--outline);
    border-radius: 0.75rem;
    background: var(--panel);
    color: var(--text);
    width: min(40rem, calc(100vw - 2rem));
    max-height: calc(100svh - var(--edge-top) - var(--edge-bottom));
    padding: 0;
    box-shadow: 0 0.5rem 2rem #0006;
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
  }

  dialog::backdrop {
    background: #111115aa;
  }

  h2 {
    margin: 0;
    padding: 0.94rem 1.1rem;
    font-size: 1.25rem;
  }

  .content {
    padding: 0 1.1rem 0.8rem;
    overflow: auto;
    min-height: 0;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1.1rem;
    border-top: 1px solid var(--outline);
  }
</style>
