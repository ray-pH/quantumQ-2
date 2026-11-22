<script lang="ts">
  import { GATE_MATRICES, Gate } from "@quantumq/core";
  import type { Complex, CustomGate, Matrix } from "@quantumq/core";
  import { gateNames } from "../assets";
  import GateIcon from "./GateIcon.svelte";

  let {
    title,
    customGates,
    useNotSymbol,
  }: {
    title?: string;
    customGates?: readonly CustomGate[];
    useNotSymbol: boolean;
  } = $props();

  const headingId = $props.id();
  const basisInputs = [0, 1] as const;
  const builtInGates = [Gate.H, Gate.X, Gate.Y, Gate.Z, Gate.S].map((id) => ({
    id,
    name: gateNames[id],
    matrix: GATE_MATRICES[id],
    customGate: undefined,
  }));
  const gates = $derived(
    customGates?.map((gate) => ({
      id: gate.id,
      name: gate.name,
      matrix: gate.matrix,
      customGate: gate,
    })) ?? builtInGates,
  );

  function formatCoefficient([real, imaginary]: Complex): string {
    if (imaginary === 0) return String(real).replaceAll("-", "−");
    const magnitude = Math.abs(imaginary);
    const term = magnitude === 1 ? "i" : `${magnitude}i`;
    const sign = imaginary < 0 ? "−" : "+";
    const value =
      real === 0
        ? `${imaginary < 0 ? "−" : ""}${term}`
        : `${real} ${sign} ${term}`;
    return value.replaceAll("-", "−");
  }

  function basisTerms(matrix: Matrix, input: 0 | 1, factor: number) {
    return matrix.flatMap((row, basis) => {
      const [real, imaginary] = row[input];
      if (real === 0 && imaginary === 0) return [];

      const negative = imaginary === 0 ? real < 0 : real === 0 && imaginary < 0;
      const scale = negative ? -factor : factor;
      const coefficient = formatCoefficient([real / scale, imaginary / scale]);
      return [
        {
          basis,
          negative,
          coefficient: real && imaginary ? `(${coefficient})` : coefficient,
        },
      ];
    });
  }
</script>

<section aria-labelledby={title ? headingId : undefined} class:custom={title}>
  {#if title}
    <h3 id={headingId}>{title}</h3>
  {/if}
  <div class="table-scroll">
    <table aria-label={title ? undefined : "Built-in gates"}>
      <thead>
        <tr>
          <th class="gate-name">Gate</th>
          <th class="symbol">Symbol</th>
          <th class="matrix">Matrix</th>
          <th>Input → Output</th>
        </tr>
      </thead>
      <tbody>
        {#each gates as gate (gate.id)}
          {@const hadamard = gate.id === Gate.H}
          {@const factor = hadamard ? Math.SQRT1_2 : 1}
          <tr>
            <th scope="row">{gate.name}</th>
            <td class="icon">
              <GateIcon
                gate={gate.id}
                customGate={gate.customGate}
                {useNotSymbol}
                hoverable={false}
              />
            </td>
            <td>
              <math class="math" displaystyle="true">
                {#if hadamard}
                  <mfrac><mn>1</mn><msqrt><mn>2</mn></msqrt></mfrac>
                {/if}
                <mo>[</mo>
                <mtable>
                  {#each gate.matrix as row}
                    <mtr>
                      {#each row as coefficient}
                        <mtd>
                          <mtext
                            >{formatCoefficient([
                              coefficient[0] / factor,
                              coefficient[1] / factor,
                            ])}</mtext
                          >
                        </mtd>
                      {/each}
                    </mtr>
                  {/each}
                </mtable>
                <mo>]</mo>
              </math>
            </td>
            <td>
              {#each basisInputs as input (input)}
                {@const terms = basisTerms(gate.matrix, input, factor)}
                <div class="mapping">
                  <math class="math" displaystyle="true">
                    {#snippet state()}
                      <mrow>
                        {#each terms as term, index (term.basis)}
                          {#if term.negative || index > 0}
                            <mo lspace="0.15em" rspace="0.15em"
                              >{term.negative ? "−" : "+"}</mo
                            >
                          {/if}
                          {#if term.coefficient !== "1"}
                            <mtext>{term.coefficient}</mtext>
                          {/if}
                          <mtext>|{term.basis}⟩</mtext>
                        {/each}
                      </mrow>
                    {/snippet}
                    <mtext>|{input}⟩</mtext>
                    <mo>→</mo>
                    {#if hadamard}
                      <mfrac>
                        {@render state()}
                        <msqrt><mn>2</mn></msqrt>
                      </mfrac>
                    {:else}
                      {@render state()}
                    {/if}
                  </math>
                </div>
              {/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .custom {
    margin-top: 1rem;
  }

  h3 {
    margin: 0 0 0.35rem;
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }

  .table-scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  th,
  td {
    padding: 0.45rem 0.35rem;
    border-bottom: 1px solid var(--outline);
  }

  .symbol {
    white-space: nowrap;
  }

  .gate-name {
    width: 32%;
  }

  .matrix {
    width: 25%;
  }

  tbody th {
    font-weight: 400;
    overflow-wrap: anywhere;
  }

  .icon {
    width: 3.8rem;
    min-width: 2.75rem;
  }

  .mapping + .mapping {
    margin-top: 0.35rem;
  }

  @media (max-width: 480px) {
    table {
      font-size: 0.875rem;
    }

    th,
    td {
      padding-inline: 0.125rem;
    }

    .gate-name {
      width: 28%;
      min-width: 4.1rem;
    }

    tbody th {
      font-size: 0.8125rem;
    }

    .icon {
      width: 2.6rem;
      min-width: 2.35rem;
    }

    math {
      font-size: 0.77rem;
    }
  }
</style>
