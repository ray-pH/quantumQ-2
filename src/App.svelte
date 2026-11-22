<script lang="ts">
  import { onMount, tick } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { createGameApp, levelPackKey, packLevels } from "@quantumq/core";
  import type { GameApp, GameState, LevelPack } from "@quantumq/core";
  import { asset } from "./assets";
  import GameBoard from "./components/GameBoard.svelte";
  import GateReference from "./components/GateReference.svelte";
  import LevelSelect from "./components/LevelSelect.svelte";
  import type { MenuDialog } from "./components/LevelSelect.svelte";
  import Modal from "./components/Modal.svelte";
  import PackInfo from "./components/PackInfo.svelte";
  import RichText from "./components/RichText.svelte";
  import { getStorage } from "./storage";

  type Dialog = MenuDialog | "help" | "return" | "success";
  const dialogs: Record<Dialog, string> = {
    gates: "Gates",
    options: "Options",
    about: "About",
    help: "Help",
    return: "Return to Menu?",
    success: "Success",
  };
  let app: GameApp | undefined;
  let gameState = $state.raw<GameState>();
  let modal = $state.raw<Dialog | { pack: LevelPack }>();
  let loadError = $state(false);
  let levelList = $state<HTMLElement>();
  const expandedPacks = new SvelteSet<string>();
  let levelScroll = 0;
  let pageScroll = 0;
  let lastEntered: { id: number; packKey?: string } | undefined;
  let unsubscribe = () => {};
  let mounted = false;

  async function initialize() {
    loadError = false;
    try {
      const loaded = await createGameApp({ storage: getStorage() });
      if (!mounted) return;
      app = loaded;
      unsubscribe = app.subscribe((snapshot) => (gameState = snapshot));
    } catch {
      if (mounted) loadError = true;
    }
  }

  onMount(() => {
    mounted = true;
    void initialize();
    window.addEventListener("quantumqback", goBack);
    return () => {
      window.removeEventListener("quantumqback", goBack);
      mounted = false;
      unsubscribe();
    };
  });

  function dismiss() {
    modal = undefined;
  }

  async function showBoard() {
    const board = gameState?.board;
    if (!board) return;
    window.scrollTo(0, 0);
    modal = board.help.length ? "help" : undefined;
    if (modal) return;

    await tick();
    document
      .querySelector<HTMLElement>("[data-screen-title]")
      ?.focus({ preventScroll: true });
  }

  function openLevel(id: number, packKey?: string) {
    levelScroll = levelList?.scrollTop ?? 0;
    pageScroll = window.scrollY;
    if (!app?.openLevel(id, packKey)) return;
    lastEntered = { id, packKey };
    void showBoard();
  }

  function goNext() {
    if (!app?.nextLevel()) return;
    const board = gameState?.board;
    if (board) {
      lastEntered = {
        id: board.level.id,
        packKey: board.pack ? levelPackKey(board.pack) : undefined,
      };
    }
    void showBoard();
  }

  async function returnToMenu() {
    dismiss();
    app?.returnToMenu();
    await tick();
    if (levelList) levelList.scrollTop = levelScroll;
    window.scrollTo(0, pageScroll);
    if (lastEntered) {
      const { id, packKey } = lastEntered;
      const scope =
        packKey === undefined
          ? ":not([data-pack-key])"
          : `[data-pack-key="${CSS.escape(packKey)}"]`;
      levelList
        ?.querySelector<HTMLElement>(`[data-level="${id}"]${scope}`)
        ?.focus({ preventScroll: true });
    }
  }

  function evaluate() {
    if (app?.evaluate()?.solved) modal = "success";
  }

  function goBack(event: Event) {
    if (modal === "return") {
      event.preventDefault();
      void returnToMenu();
    } else if (modal) {
      event.preventDefault();
      dismiss();
    } else if (gameState?.board) {
      event.preventDefault();
      modal = "return";
    }
  }

  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape" && !modal) goBack(event);
    if (
      (event.key === "Enter" || event.key === " ") &&
      !event.repeat &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !modal &&
      gameState?.board &&
      event.target instanceof HTMLElement &&
      !event.target.closest(
        "button, input, a, textarea, select, [contenteditable]",
      )
    ) {
      event.preventDefault();
      evaluate();
    }
  }
</script>

<svelte:window onkeydown={keydown} />

{#if gameState}
  {#if gameState.board}
    {#key gameState.board.level.id}
      <GameBoard
        board={gameState.board}
        useNotSymbol={gameState.save.useNotSymbol}
        selectGate={(gate) => app?.selectGate(gate)}
        placeGate={(row, column) => app?.placeGate(row, column)}
        {evaluate}
        menu={() => (modal = "return")}
        help={() => (modal = "help")}
      />
    {/key}
  {:else}
    <LevelSelect
      save={gameState.save}
      {openLevel}
      {expandedPacks}
      installPack={async (pack) => {
        await app?.installLevelPack(pack);
      }}
      movePack={(key, direction) => app?.moveLevelPack(key, direction)}
      openPackInfo={(pack) => (modal = { pack })}
      openDialog={(dialog) => (modal = dialog)}
      bind:scrollRegion={levelList}
    />
  {/if}

  {#if gameState.saveError}
    <aside class="save-error">
      <p role="status">Profile changes could not be saved.</p>
      <button class="button" onclick={() => app?.retrySave()}>Retry</button>
    </aside>
  {/if}
{:else}
  <main class="loading">
    {#if loadError}
      <p role="alert">QuantumQ could not load your saved progress.</p>
      <button class="button" onclick={initialize}>Retry</button>
    {:else}
      <p role="status">Loading QuantumQ…</p>
    {/if}
  </main>
{/if}

{#if modal && gameState}
  {#key modal}
    {@const game = gameState}
    {@const dialog = modal}
    <Modal
      title={typeof dialog === "string" ? dialogs[dialog] : dialog.pack.name}
      {dismiss}
    >
      {#snippet children()}
        {#if typeof dialog !== "string"}
          <PackInfo pack={dialog.pack} useNotSymbol={game.save.useNotSymbol} />
        {:else if dialog === "help" && game.board}
          <RichText
            parts={game.board.help}
            useNotSymbol={game.save.useNotSymbol}
          />
        {:else if dialog === "gates"}
          <GateReference useNotSymbol={game.save.useNotSymbol} />
          {#each game.save.packs as pack (levelPackKey(pack))}
            {#if pack.gates.length}
              <GateReference
                title={pack.name}
                customGates={pack.gates}
                useNotSymbol={game.save.useNotSymbol}
              />
            {/if}
          {/each}
        {:else if dialog === "options"}
          <label class="option">
            <input
              type="checkbox"
              checked={game.save.useNotSymbol}
              onchange={(event) =>
                app?.setUseNotSymbol(event.currentTarget.checked)}
            />
            Use ⊕ Symbol
          </label>
        {:else if dialog === "about"}
          <p>QuantumQ · Circuit Puzzle</p>
          <p>Version 2.0.0<br />Rayhan Alghiffari Azizi</p>
          <a href={asset("licenses/quantumq.txt")} download
            >GNU General Public License</a
          >
        {:else if dialog === "success" && game.board?.result?.nextLevelId === null}
          {@const pack = game.board.pack}
          {@const completed = pack
            ? (game.save.packProgress[levelPackKey(pack)] ?? [])
            : []}
          {#if !pack || packLevels(pack).every(({ id, goal }) => !goal || completed.includes(id))}
            <p>You completed the final puzzle.</p>
          {/if}
        {/if}
      {/snippet}

      {#snippet actions()}
        {#if dialog === "return"}
          <button class="button" onclick={dismiss}>Cancel</button>
          <button class="button" onclick={returnToMenu}>OK</button>
        {:else if dialog === "success"}
          <button class="button" onclick={dismiss}>Close</button>
          {#if game.board?.result?.nextLevelId != null}
            <button class="button" onclick={goNext}>Next Level</button>
          {:else}
            <button class="button" onclick={returnToMenu}>Level Menu</button>
          {/if}
        {:else}
          <button class="button" onclick={dismiss}>Close</button>
        {/if}
      {/snippet}
    </Modal>
  {/key}
{/if}

<style>
  .loading {
    padding: 2rem;
  }

  .save-error {
    position: fixed;
    inset: auto var(--edge-right) var(--edge-bottom) var(--edge-left);
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: fit-content;
    max-width: calc(100% - var(--edge-left) - var(--edge-right));
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--outline);
    padding: 0.5rem 0.65rem;
    border-radius: 0.5rem;
  }

  .save-error p {
    margin: 0;
  }

  .option {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    min-height: 2.75rem;
  }

  .option input {
    width: 1.15rem;
    height: 1.15rem;
    accent-color: var(--focus);
  }
</style>
