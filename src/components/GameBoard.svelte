<script lang="ts">
  import type { Board, Complex } from "@quantumq/core";
  import { asset, gateName } from "../assets";
  import CircuitBoard from "./CircuitBoard.svelte";
  import GateIcon from "./GateIcon.svelte";
  import RichText from "./RichText.svelte";

  let {
    board,
    useNotSymbol,
    selectGate,
    placeGate,
    evaluate,
    menu,
    help,
  }: {
    board: Board;
    useNotSymbol: boolean;
    selectGate: (gate: string) => void;
    placeGate: (row: number, column: number) => void;
    evaluate: () => void;
    menu: () => void;
    help: () => void;
  } = $props();

  let showAll = $state(false);
  const rows = $derived(
    board.result?.rows.filter((row) => showAll || row.probability > 0.00001),
  );

  function coefficient([real, imaginary]: Complex) {
    return `${real.toFixed(4)} ${imaginary < 0 ? "−" : "+"} ${Math.abs(imaginary).toFixed(4)}i`;
  }
</script>

<main class="game">
  <h1 class="sr-only" tabindex="-1" data-screen-title>
    {board.pack
      ? board.level.description
      : `${board.level.goal ? "Level" : "Sandbox"} ${board.level.id}`}
  </h1>
  <header class="toolbar">
    <button class="button back" aria-label="Return to menu" onclick={menu}
      >‹</button
    >
    <div class="palette" role="group" aria-label="Available gates">
      {#each board.level.gates as gate (gate)}
        {@const customGate = board.customGates.get(gate)}
        <button
          class="gate"
          aria-label={gateName(gate, customGate)}
          aria-pressed={board.selectedGate === gate}
          onclick={() => selectGate(gate)}
        >
          <GateIcon {gate} {customGate} {useNotSymbol} />
          {#if board.selectedGate === gate}
            <img
              class="selected"
              src={asset("sprites/gateSelected.png")}
              alt=""
            />
          {/if}
        </button>
      {/each}
    </div>
    <button class="button evaluate" onclick={evaluate}>Evaluate</button>
  </header>

  <div class="workspace">
    <div class="board">
      <CircuitBoard {board} {useNotSymbol} {placeGate} />
    </div>

    <div class="details">
      <section class="panel" aria-labelledby="task-title">
        <header>
          <h2 id="task-title">Task</h2>
          {#if board.help.length}
            <button class="button help" aria-label="Level help" onclick={help}
              >?</button
            >
          {/if}
        </header>
        <div class="panel-body">
          <RichText parts={[board.level.task]} {useNotSymbol} />
        </div>
      </section>

      <section class="panel" aria-labelledby="result-title">
        <header>
          <h2 id="result-title">Result</h2>
          <button
            class="button show-all"
            aria-pressed={showAll}
            onclick={() => (showAll = !showAll)}
          >
            Show all
          </button>
        </header>
        <div class="panel-body" aria-live="polite">
          {#if rows}
            <table>
              <thead class="sr-only">
                <tr
                  ><th>Amplitude</th><th>Basis state</th><th>Probability</th
                  ></tr
                >
              </thead>
              <tbody>
                {#each rows as row (row.basis)}
                  <tr class:negligible={row.probability <= 0.00001}>
                    <td>{coefficient(row.amplitude)}</td>
                    <td class="math">|{row.basis}⟩</td>
                    <td>{(row.probability * 100).toFixed(2)}%</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="no-result">[ Not yet calculated ]</p>
          {/if}
        </div>
      </section>
    </div>
  </div>
</main>

<style>
  .game {
    --cell: clamp(2.75rem, calc((100vw - 3.5rem) / 13), 4rem);
    width: min(100%, 95rem);
    margin-inline: auto;
    padding: var(--edge-top) var(--edge-right) var(--edge-bottom)
      var(--edge-left);
  }

  .toolbar {
    background: var(--panel);
    border: 1px solid var(--outline);
    border-radius: 0.6rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: "back palette eval";
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.7rem;
  }

  .back {
    grid-area: back;
    padding-inline: 0;
    width: 2.75rem;
    font-size: 1.7rem;
    line-height: 1;
  }

  .palette {
    grid-area: palette;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .gate {
    width: clamp(2.75rem, 6vw, 4rem);
    background: none;
    padding: 0;
    border: 0;
    border-radius: 0.4rem;
    position: relative;
  }

  .selected {
    position: absolute;
    inset: 0;
    width: 100%;
    pointer-events: none;
  }

  .evaluate {
    grid-area: eval;
    padding-inline: clamp(0.75rem, 3vw, 1.75rem);
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.75rem;
  }

  .board {
    background: var(--board);
    border-radius: 0.6rem;
    min-width: 0;
    display: grid;
    align-content: start;
    min-height: 11rem;
  }

  .details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 0.75rem;
  }

  .panel {
    background: var(--panel);
    border: 1px solid var(--outline);
    border-radius: 0.6rem;
    min-width: 0;
  }

  .panel header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.65rem;
    min-height: 3.5rem;
    border-bottom: 2px solid var(--accent);
  }

  h2 {
    font-size: 1.1rem;
    margin: 0;
  }

  .help {
    width: 2.75rem;
    padding: 0;
  }

  .show-all {
    background: #3b3b42;
    font-weight: 400;
  }

  .show-all:hover {
    background: #484950;
  }

  .panel-body {
    padding: 0.75rem;
    min-height: 4rem;
    overflow: auto;
    max-height: 22rem;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    font-family: "Ubuntu Mono", monospace;
    font-variant-numeric: tabular-nums;
  }

  td {
    white-space: nowrap;
    padding: 0.08rem 0.55rem 0.08rem 0;
  }

  td:last-child {
    text-align: right;
    padding-right: 0;
  }

  .negligible,
  .no-result {
    color: var(--muted);
  }

  .no-result {
    margin: 0;
  }

  @media (min-width: 1170px) {
    .game {
      --cell: clamp(3.4rem, calc((100vw - 24rem) / 13), 4.4rem);
    }

    .workspace {
      grid-template-columns: minmax(0, 1fr) minmax(19rem, 0.39fr);
      align-items: start;
    }

    .details {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 625px) {
    .board {
      min-height: auto;
    }

    .details {
      grid-template-columns: minmax(0, 1fr);
    }

    .toolbar {
      grid-template-areas: "back . eval" "palette palette palette";
    }
  }
</style>
