<script lang="ts">
  import { isTauri } from "@tauri-apps/api/core";
  import { openUrl } from "@tauri-apps/plugin-opener";

  let {
    href,
    label,
    asButton = false,
  }: {
    href: string;
    label: string;
    asButton?: boolean;
  } = $props();

  const native = isTauri();
  let failed = $state(false);

  async function open() {
    failed = false;
    try {
      await openUrl(href);
    } catch {
      failed = true;
    }
  }
</script>

{#if native}
  <button
    type="button"
    class:button={asButton}
    class:text-link={!asButton}
    onclick={open}>{label}</button
  >
{:else}
  <a class:button={asButton} {href} target="_blank" rel="noopener noreferrer"
    >{label}</a
  >
{/if}

{#if failed}
  <p class="error" role="alert">
    QuantumQ could not open the link in your browser.
  </p>
{/if}

<style>
  a.button {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }

  .text-link {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--focus);
    text-decoration: underline;
  }

  .error {
    flex-basis: 100%;
    margin: 0;
    color: #ffbcb6;
  }
</style>
