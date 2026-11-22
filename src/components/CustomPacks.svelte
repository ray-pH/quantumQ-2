<script lang="ts">
  import { isPackLevelUnlocked, levelPackKey } from "@quantumq/core";
  import type { LevelPack } from "@quantumq/core";
  import type { SvelteSet } from "svelte/reactivity";
  import { packGuideUrl } from "../links";
  import { readLevelPackArchive } from "../packArchive";
  import ExternalLink from "./ExternalLink.svelte";

  let {
    packs,
    progress,
    expandedPacks,
    openLevel,
    installPack,
    movePack,
    openPackInfo,
  }: {
    packs: readonly LevelPack[];
    progress: Readonly<Record<string, readonly number[]>>;
    expandedPacks: SvelteSet<string>;
    openLevel: (id: number, packKey: string) => void;
    installPack: (pack: LevelPack) => Promise<void>;
    movePack: (key: string, direction: -1 | 1) => void;
    openPackInfo: (pack: LevelPack) => void;
  } = $props();

  let fileInput: HTMLInputElement;
  let importing = $state(false);
  let error = $state("");

  function togglePack(key: string) {
    if (!expandedPacks.delete(key)) expandedPacks.add(key);
  }

  async function importPack(
    event: Event & { currentTarget: HTMLInputElement },
  ) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || importing) return;

    error = "";
    importing = true;
    try {
      const pack = await readLevelPackArchive(file);
      await installPack(pack);
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : "This level pack could not be imported.";
    } finally {
      importing = false;
    }
  }
</script>

<section class="custom-packs" aria-labelledby="custom-pack-title">
  <h2 id="custom-pack-title">Custom level packs</h2>
  <div class="actions">
    <input
      type="file"
      accept=".zip,application/zip"
      bind:this={fileInput}
      onchange={importPack}
      hidden
    />
    <button
      class="button"
      disabled={importing}
      onclick={() => fileInput.click()}
    >
      {importing ? "Importing…" : "Import ZIP"}
    </button>
    <ExternalLink href={packGuideUrl} label="Pack guide" asButton />
  </div>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#each packs as pack, index (levelPackKey(pack))}
    {@const key = levelPackKey(pack)}
    {@const completed = progress[key] ?? []}
    {@const expanded = expandedPacks.has(key)}
    {@const panelId = `pack-levels-${key}`}
    <section class="pack" aria-label={pack.name}>
      <header>
        <div>
          <h3>
            <button
              class="pack-toggle"
              aria-expanded={expanded}
              aria-controls={panelId}
              onclick={() => togglePack(key)}
            >
              <span class="chevron" aria-hidden="true"></span>
              {pack.name}
            </button>
          </h3>
          <p class="metadata">
            {key}{pack.version ? ` · v${pack.version}` : ""}
          </p>
        </div>
        <div class="actions pack-actions">
          <button
            class="button"
            aria-label={`Info about ${pack.name}`}
            aria-haspopup="dialog"
            onclick={() => openPackInfo(pack)}
          >
            <span class="info-icon" aria-hidden="true">i</span>
          </button>
          <button
            class="button"
            aria-label={`Move ${pack.name} up`}
            disabled={index === 0}
            onclick={() => movePack(key, -1)}
          >
            <span class="chevron up" aria-hidden="true"></span>
          </button>
          <button
            class="button"
            aria-label={`Move ${pack.name} down`}
            disabled={index === packs.length - 1}
            onclick={() => movePack(key, 1)}
          >
            <span class="chevron down" aria-hidden="true"></span>
          </button>
        </div>
      </header>
      <div id={panelId} hidden={!expanded}>
        {#each pack.sections as section}
          <div class="pack-section">
            <h4>{section.name}</h4>
            <div class="level-grid">
              {#each section.levels as level (level.id)}
                {@const unlocked = isPackLevelUnlocked(level, completed)}
                <button
                  class="button level-button"
                  class:long-id={level.id >= 1000}
                  data-level={level.id}
                  data-pack-key={key}
                  aria-label={`${level.goal ? "Level" : "Sandbox"} ${level.id}, ${level.description}${unlocked ? "" : ", locked"}`}
                  disabled={!unlocked}
                  onclick={() => openLevel(level.id, key)}
                >
                  {level.id}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</section>

<style>
  .custom-packs {
    border-top: 1px solid var(--outline);
    margin-top: 1.5rem;
    padding-top: 1rem;
  }

  h2,
  h3,
  h4,
  p {
    margin: 0;
    overflow-wrap: anywhere;
  }

  h2,
  h3 {
    font-size: 1.1rem;
  }

  h4 {
    font-size: 1rem;
    font-weight: normal;
    margin-bottom: 0.4rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.55rem;
  }

  .error {
    margin-top: 0.65rem;
    color: #ffbcb6;
  }

  .pack {
    border: 1px solid var(--outline);
    border-radius: 0.55rem;
    margin-top: 0.85rem;
    padding: 0.7rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.55rem;
  }

  .pack-toggle {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 1.5rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font-weight: 700;
    text-align: start;
  }

  .chevron {
    display: inline-block;
    flex: none;
    width: 0.55rem;
    height: 0.55rem;
    border: solid currentColor;
    border-width: 0 2px 2px 0;
    rotate: -45deg;
  }

  .pack-toggle[aria-expanded="true"] .chevron,
  .chevron.down {
    rotate: 45deg;
  }

  .chevron.up {
    rotate: -135deg;
  }

  .metadata {
    color: var(--muted);
    font-size: 0.85rem;
    margin-inline-start: 1.1rem;
  }

  .pack-actions {
    flex: none;
    margin-top: 0;
  }

  .pack-actions .button {
    display: grid;
    place-items: center;
    min-width: 2.75rem;
    padding: 0.25rem;
  }

  .info-icon {
    display: grid;
    place-items: center;
    width: 1.05rem;
    height: 1.05rem;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    font-size: 0.75rem;
    line-height: 1;
  }

  .pack-section {
    margin-top: 0.8rem;
  }

  .long-id {
    font-size: 0.65rem;
  }
</style>
