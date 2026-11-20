<script lang="ts">
  import { Gate } from "@quantumq/core";
  import { asset, gateImage } from "../assets";

  type Tag = "b" | "i" | "code";
  type Piece =
    | { kind: "text"; value: string }
    | { kind: "image"; path: string; width: number }
    | { kind: Tag; children: Piece[] };

  let {
    parts,
    useNotSymbol,
  }: {
    parts: readonly string[];
    useNotSymbol: boolean;
  } = $props();

  function parse(parts: readonly string[]): Piece[] {
    const text = parts
      .map((part) =>
        /^sprites\/[\w-]+\.png$/.test(part) ? `[img=64]${part}[/img]` : part,
      )
      .join("");
    const tokens =
      /\[img=(\d+)\]((?:img|sprites)\/[\w-]+\.png)\[\/img\]|\[(\/?)(b|i|code)\]/g;
    const content: Piece[] = [];
    const stack: { kind?: Tag; children: Piece[] }[] = [{ children: content }];
    let cursor = 0;

    for (const match of text.matchAll(tokens)) {
      const current = stack[stack.length - 1];
      if (match.index > cursor) {
        current.children.push({
          kind: "text",
          value: text.slice(cursor, match.index),
        });
      }
      cursor = match.index + match[0].length;

      if (match[2]) {
        current.children.push({
          kind: "image",
          path: match[2],
          width: Number(match[1]),
        });
      } else if (!match[3]) {
        const node = { kind: match[4] as Tag, children: [] as Piece[] };
        current.children.push(node);
        stack.push(node);
      } else if (current.kind === match[4]) {
        stack.pop();
      } else {
        current.children.push({ kind: "text", value: match[0] });
      }
    }

    if (cursor < text.length) {
      stack[stack.length - 1].children.push({
        kind: "text",
        value: text.slice(cursor),
      });
    }
    return content;
  }

  const content = $derived(parse(parts));

  const imageDescriptions: Record<string, string> = {
    "img/hadamard-split.png":
      "Illustration of the two outcomes of a Hadamard gate",
    "sprites/gateEmpty.png": "",
    "sprites/gateX.png": "Pauli-X gate",
    "sprites/gateY.png": "Pauli-Y gate",
    "sprites/gateZ.png": "Pauli-Z gate",
    "sprites/gateH.png": "Hadamard gate",
    "sprites/gateS.png": "Phase gate",
    "sprites/gateCtrl.png": "Control",
    "sprites/gateCXtop.png": "Controlled-NOT control",
    "sprites/gateCXbot.png": "Controlled-NOT target",
    "sprites/bit0.png": "Ket zero",
    "sprites/bit1.png": "Ket one",
  };
</script>

{#snippet render(pieces: Piece[])}
  {#each pieces as piece}
    {#if piece.kind === "text"}{piece.value}{:else if piece.kind === "image"}
      {@const notTarget =
        useNotSymbol && piece.path === "sprites/gateCXbot.png"}
      <img
        class:not-target={notTarget}
        src={notTarget || piece.path === "sprites/gateX.png"
          ? gateImage(Gate.X, useNotSymbol)
          : asset(piece.path)}
        width={piece.width}
        alt={imageDescriptions[piece.path] ?? ""}
      />{:else if piece.kind === "b"}<strong
        >{@render render(piece.children)}</strong
      >{:else if piece.kind === "i"}<i class="math"
        >{@render render(piece.children)}</i
      >{:else}<code>{@render render(piece.children)}</code>{/if}
  {/each}
{/snippet}

<div class="rich-text">{@render render(content)}</div>

<style>
  .rich-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  img {
    max-width: 100%;
    height: auto;
    vertical-align: middle;
  }

  .not-target {
    /* Match the 4 px wire in the 128 px control sprite and meet the circle. */
    background: linear-gradient(#fff, #fff) no-repeat center top / 3.125% 17%;
  }
</style>
