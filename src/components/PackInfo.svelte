<script lang="ts">
  import type { LevelPack } from "@quantumq/core";
  import GateReference from "./GateReference.svelte";

  let { pack, useNotSymbol }: { pack: LevelPack; useNotSymbol: boolean } =
    $props();
</script>

<dl>
  <dt>Author ID</dt>
  <dd>{pack["author-id"]}</dd>
  <dt>Pack ID</dt>
  <dd>{pack.id}</dd>
  {#if pack.version}
    <dt>Version</dt>
    <dd>{pack.version}</dd>
  {/if}
  <dt>Sections</dt>
  <dd>
    <ul>
      {#each pack.sections as section}
        <li>{section.name} ({section.levels.length})</li>
      {/each}
    </ul>
  </dd>
</dl>

{#if pack.gates.length}
  <GateReference title="Custom gates" customGates={pack.gates} {useNotSymbol} />
{:else}
  <p>This pack uses built-in gates.</p>
{/if}

<style>
  dl {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.4rem 1rem;
    margin: 0;
  }

  dt {
    font-weight: 700;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  ul {
    margin: 0;
    padding-inline-start: 1.2rem;
  }

  p {
    margin: 1rem 0 0;
  }
</style>
