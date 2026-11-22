<script lang="ts">
  import { COLUMN_COUNT, Gate } from "@quantumq/core";
  import type { Board } from "@quantumq/core";
  import { asset, gateName } from "../assets";
  import GateIcon from "./GateIcon.svelte";

  let {
    board,
    useNotSymbol,
    placeGate,
  }: {
    board: Board;
    useNotSymbol: boolean;
    placeGate: (row: number, column: number) => void;
  } = $props();

  const columns = Array.from({ length: COLUMN_COUNT }, (_, index) => index);
  const fixedCells = $derived(
    new Set(
      board.level.locked.map(([row, column]) => row * COLUMN_COUNT + column),
    ),
  );
  const controlLines = $derived.by(() =>
    columns.flatMap((column) => {
      const rows = board.circuit.map((wire) => wire[column]);
      if (
        !rows.includes(Gate.Ctrl) ||
        !rows.some((gate) => gate !== Gate.Ctrl && gate !== Gate.Empty)
      ) {
        return [];
      }
      return [
        {
          column,
          first: rows.findIndex((gate) => gate !== Gate.Empty),
          last:
            rows.length -
            1 -
            [...rows].reverse().findIndex((gate) => gate !== Gate.Empty),
        },
      ];
    }),
  );

  const direction: Record<string, readonly [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };
  let cursor = $state(0);
  let grid: HTMLDivElement;

  function moveFocus(event: KeyboardEvent, row: number, column: number) {
    const offset = direction[event.key];
    if (!offset) return;
    event.preventDefault();

    const newRow = Math.max(
      0,
      Math.min(board.circuit.length - 1, row + offset[0]),
    );
    const newColumn = Math.max(
      0,
      Math.min(COLUMN_COUNT - 1, column + offset[1]),
    );
    const index = newRow * COLUMN_COUNT + newColumn;
    const next = grid.querySelector<HTMLButtonElement>(
      `[data-cell="${index}"]`,
    );
    next?.focus({ preventScroll: true });
    next?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
</script>

<div class="board-scroll" role="region" aria-label="Quantum circuit">
  <div class="grid" bind:this={grid}>
    {#each controlLines as line (line.column)}
      <span
        class="control-line"
        aria-hidden="true"
        style:grid-column={line.column + 2}
        style:grid-row={`${line.first + 1} / ${line.last + 2}`}
      ></span>
    {/each}

    {#each board.circuit as wire, row (row)}
      {@const input = board.level.input}
      <div class="input" style:grid-row={row + 1}>
        {#if input.kind === "basis"}
          <img
            src={asset(`sprites/bit${input.bits[row]}.png`)}
            alt={`Input | ${input.bits[row]} ⟩`}
          />
        {:else if row === 0}
          <img
            src={asset("sprites/bitPsi.png")}
            alt="Custom input state | ψ ⟩"
          />
        {/if}
      </div>
      {#each wire as gate, column (column)}
        {@const index = row * COLUMN_COUNT + column}
        {@const locked = fixedCells.has(index)}
        {@const customGate = board.customGates.get(gate)}
        <button
          class="cell"
          class:locked
          class:not-symbol={gate === Gate.X && useNotSymbol}
          style:grid-row={row + 1}
          style:grid-column={column + 2}
          aria-label={`Qubit ${row + 1}, column ${column + 1}, ${gateName(gate, customGate)}${locked ? ", locked" : ""}`}
          aria-disabled={locked}
          tabindex={cursor === index ? 0 : -1}
          data-cell={index}
          onfocus={() => (cursor = index)}
          onkeydown={(event) => moveFocus(event, row, column)}
          onclick={() => placeGate(row, column)}
        >
          <GateIcon {gate} {customGate} {useNotSymbol} hoverable={!locked} />
        </button>
      {/each}
    {/each}
  </div>
</div>

<style>
  .board-scroll {
    overflow-x: auto;
    padding: 0.35rem 0.25rem 0.75rem;
    scroll-padding-inline-start: calc(var(--cell) + 0.5rem);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(13, var(--cell));
    grid-auto-rows: var(--cell);
    width: max-content;
    margin-inline: auto;
    isolation: isolate;
  }

  .input {
    position: sticky;
    left: 0;
    z-index: 2;
    grid-column: 1;
    background: var(--board);
  }

  .input img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .cell {
    position: relative;
    z-index: 1;
    padding: 0;
    border: 0;
    background: transparent;
    border-radius: 0.45rem;
  }

  .cell:focus-visible {
    z-index: 2;
    outline-offset: -2px;
  }

  .locked {
    cursor: default;
    background: #7773;
  }

  .not-symbol::before {
    content: "";
    position: absolute;
    inset: 17%;
    border-radius: 50%;
    background: var(--board);
  }

  /* Dim the cell with a foreground layer so wires cannot show through the gate. */
  .locked::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--board);
    opacity: 0.5;
    pointer-events: none;
  }

  .control-line {
    pointer-events: none;
    width: 6.25%;
    height: calc(100% - var(--cell));
    justify-self: center;
    align-self: center;
    background: #fff;
  }
</style>
