<script lang="ts">
  import { onMount, tick } from "svelte";
  import { createGameApp, Gate, TUTORIALS } from "@quantumq/core";
  import type { GameApp, GameState } from "@quantumq/core";
  import { asset, gateNames } from "./assets";
  import GameBoard from "./components/GameBoard.svelte";
  import GateIcon from "./components/GateIcon.svelte";
  import LevelSelect from "./components/LevelSelect.svelte";
  import type { MenuDialog } from "./components/LevelSelect.svelte";
  import Modal from "./components/Modal.svelte";
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
  const gateReference = [
    { gate: Gate.H },
    { gate: Gate.X, zero: "|1⟩", one: "|0⟩" },
    { gate: Gate.Y, zero: "i|1⟩", one: "−i|0⟩" },
    { gate: Gate.Z, zero: "|0⟩", one: "−|1⟩" },
    { gate: Gate.S, zero: "|0⟩", one: "i|1⟩" },
  ] as const;

  let app: GameApp | undefined;
  let gameState = $state.raw<GameState>();
  let modal = $state<Dialog>();
  let loadError = $state(false);
  let levelList = $state<HTMLElement>();
  let levelScroll = 0;
  let pageScroll = 0;
  let lastEntered: number | undefined;
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
    const id = gameState?.board?.level.id;
    if (id === undefined) return;
    window.scrollTo(0, 0);
    modal = TUTORIALS[id]?.length ? "help" : undefined;
    if (modal) return;

    await tick();
    document
      .querySelector<HTMLElement>("[data-screen-title]")
      ?.focus({ preventScroll: true });
  }

  function openLevel(id: number) {
    levelScroll = levelList?.scrollTop ?? 0;
    pageScroll = window.scrollY;
    if (!app?.openLevel(id)) return;
    lastEntered = id;
    void showBoard();
  }

  function goNext() {
    if (!app?.nextLevel()) return;
    lastEntered = gameState?.board?.level.id;
    void showBoard();
  }

  async function returnToMenu() {
    dismiss();
    app?.returnToMenu();
    await tick();
    if (levelList) levelList.scrollTop = levelScroll;
    window.scrollTo(0, pageScroll);
    levelList
      ?.querySelector<HTMLElement>(`[data-level="${lastEntered}"]`)
      ?.focus({ preventScroll: true });
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
      unlocked={gameState.save.unlocked}
      {openLevel}
      openDialog={(dialog) => (modal = dialog)}
      bind:scrollRegion={levelList}
    />
  {/if}

  {#if gameState.saveError}
    <aside class="save-error">
      <p role="status">Progress could not be saved.</p>
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
    <Modal title={dialogs[modal]} {dismiss}>
      {#snippet children()}
        {#if modal === "help" && game.board}
          <RichText
            parts={TUTORIALS[game.board.level.id] ?? []}
            useNotSymbol={game.save.useNotSymbol}
          />
        {:else if modal === "gates"}
          <table class="reference">
            <thead>
              <tr><th>Gate</th><th>Symbol</th><th>Input → Output</th></tr>
            </thead>
            <tbody>
              {#each gateReference as reference (reference.gate)}
                {@const gate = reference.gate}
                <tr>
                  <td>{gateNames[gate]}</td>
                  <td class="icon"
                    ><GateIcon
                      {gate}
                      useNotSymbol={game.save.useNotSymbol}
                      hoverable={false}
                    /></td
                  >
                  <td class="math">
                    {#if reference.gate === Gate.H}
                      {#each [0, 1] as input (input)}
                        <div class="hadamard-mapping">
                          <math class="math" displaystyle="true">
                            <mtext>|{input}⟩</mtext>
                            <mo>→</mo>
                            <mfrac>
                              <mrow>
                                <mtext>|0⟩</mtext>
                                <mo lspace="0.15em" rspace="0.15em"
                                  >{input === 0 ? "+" : "−"}</mo
                                >
                                <mtext>|1⟩</mtext>
                              </mrow>
                              <msqrt><mn>2</mn></msqrt>
                            </mfrac>
                          </math>
                        </div>
                      {/each}
                    {:else}
                      |0⟩ → {reference.zero}<br />|1⟩ → {reference.one}
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else if modal === "options"}
          <label class="option">
            <input
              type="checkbox"
              checked={game.save.useNotSymbol}
              onchange={(event) =>
                app?.setUseNotSymbol(event.currentTarget.checked)}
            />
            Use ⊕ Symbol
          </label>
        {:else if modal === "about"}
          <p>QuantumQ · Circuit Puzzle</p>
          <p>Version 2.0.0<br />Rayhan Alghiffari Azizi</p>
          <a href={asset("licenses/quantumq.txt")} download
            >GNU General Public License</a
          >
        {:else if modal === "success" && game.board?.result?.nextLevelId === null}
          <p>You completed the final puzzle.</p>
        {/if}
      {/snippet}

      {#snippet actions()}
        {#if modal === "return"}
          <button class="button" onclick={dismiss}>Cancel</button>
          <button class="button" onclick={returnToMenu}>OK</button>
        {:else if modal === "success"}
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

  .reference {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .reference th,
  .reference td {
    padding: 0.45rem 0.35rem;
    border-bottom: 1px solid var(--outline);
  }

  .icon {
    width: 3.8rem;
    min-width: 2.75rem;
  }

  .hadamard-mapping + .hadamard-mapping {
    margin-top: 0.35rem;
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
