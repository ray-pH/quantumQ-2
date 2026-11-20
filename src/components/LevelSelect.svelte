<script lang="ts">
  import { LEVELS, SECTIONS } from "@quantumq/core";
  import type { Level } from "@quantumq/core";
  import { asset } from "../assets";

  export type MenuDialog = "gates" | "options" | "about";

  let {
    unlocked,
    openLevel,
    openDialog,
    scrollRegion = $bindable(),
  }: {
    unlocked: readonly number[];
    openLevel: (id: number) => void;
    openDialog: (dialog: MenuDialog) => void;
    scrollRegion: HTMLElement | undefined;
  } = $props();

  const sections: { heading: string; levels: Level[] }[] = [];
  for (const level of LEVELS) {
    const heading = SECTIONS[level.id];
    if (heading !== undefined) sections.push({ heading, levels: [] });
    sections[sections.length - 1].levels.push(level);
  }
</script>

<main class="level-select">
  <div class="menu">
    <img
      src={asset("sprites/QuantumQsmall.png")}
      alt=""
      width="300"
      height="300"
    />
    <h1>QuantumQ</h1>
    <nav aria-label="Game menu">
      <button class="button" onclick={() => openDialog("gates")}>Gates</button>
      <button class="button" onclick={() => openDialog("options")}
        >Options</button
      >
      <button class="button" onclick={() => openDialog("about")}>About</button>
    </nav>
  </div>

  <section class="levels" bind:this={scrollRegion} aria-label="Levels">
    {#each sections as section}
      <div class="section" aria-label={section.heading || undefined}>
        {#if section.heading}
          <h2>{section.heading}</h2>
        {/if}
        <div class="level-grid">
          {#each section.levels as level (level.id)}
            {@const isUnlocked = unlocked.includes(level.id)}
            <button
              class="button level-button"
              aria-label={`${level.goal === null ? "Sandbox" : "Level"} ${level.id}${isUnlocked ? "" : ", locked"}`}
              aria-disabled={!isUnlocked}
              disabled={!isUnlocked}
              data-level={level.id}
              onclick={() => openLevel(level.id)}>{level.id}</button
            >
          {/each}
        </div>
      </div>
    {/each}
  </section>
</main>

<style>
  .level-select {
    width: min(100%, 68rem);
    min-height: 100svh;
    margin-inline: auto;
    padding: var(--edge-top) var(--edge-right) var(--edge-bottom)
      var(--edge-left);
    display: grid;
    align-items: center;
    grid-template-columns: minmax(14rem, 0.95fr) minmax(20rem, 1fr);
    gap: clamp(1rem, 4vw, 4rem);
  }

  .menu {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.75rem;
  }

  .menu > img {
    width: clamp(11rem, 28vw, 18.75rem);
    height: auto;
    margin-block: -2.25rem -3.15rem;
  }

  h1 {
    font-size: clamp(1.65rem, 4vw, 2.15rem);
    margin: 0;
  }

  nav {
    display: grid;
    width: min(100%, 15rem);
    gap: 0.9rem;
    margin-top: 1.25rem;
  }

  nav .button {
    min-width: 5.5rem;
    min-height: 3.4rem;
    font-size: 1.3rem;
  }

  .levels {
    max-height: min(31rem, calc(100svh - var(--edge-top) - var(--edge-bottom)));
    overflow: auto;
    padding: 0.25rem 0.5rem 0.5rem;
  }

  .section + .section {
    margin-top: 1rem;
  }

  h2 {
    font-size: 1rem;
    font-weight: 400;
    margin: 0 0 0.45rem;
  }

  .level-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: clamp(0.35rem, 1.1vw, 0.65rem);
  }

  .level-button {
    min-width: 0;
    min-height: 2.75rem;
    aspect-ratio: 1;
    max-width: 4rem;
    padding: 0;
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }

  @media (min-width: 681px) and (max-height: 510px) {
    .menu {
      gap: 0.5rem;
    }

    .menu > img {
      width: clamp(9rem, 35svh, 14rem);
      margin-block: -1.5rem -2.1rem;
    }

    h1 {
      font-size: 1.65rem;
    }

    nav {
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    nav .button {
      min-height: 2.75rem;
      font-size: 1.05rem;
    }
  }

  @media (max-width: 680px) {
    .level-select {
      max-width: 34rem;
      min-height: auto;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
    }

    .menu {
      gap: 0.5rem;
    }

    .menu > img {
      width: 9rem;
      margin-block: -1rem -1.55rem;
    }

    nav {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      width: 100%;
      gap: 0.45rem;
      margin-top: 0.35rem;
    }

    nav .button {
      min-height: 2.75rem;
      font-size: 1rem;
    }

    .levels {
      overflow: visible;
      max-height: none;
    }
  }
</style>
