<script lang="ts">
  import type { CustomGate, Gate } from "@quantumq/core";
  import { gateImage } from "../assets";

  let {
    gate,
    customGate,
    useNotSymbol,
    hoverable = true,
  }: {
    gate: string;
    customGate?: CustomGate;
    useNotSymbol: boolean;
    hoverable?: boolean;
  } = $props();

  function fitGateLabel(label: HTMLSpanElement) {
    const face = label.parentElement!;
    let availableWidth = 0;
    let labelSize = 0;

    const observer = new ResizeObserver((entries) => {
      for (const { target, contentRect } of entries) {
        if (target === face) availableWidth = contentRect.width;
        else labelSize = Math.max(contentRect.width, contentRect.height);
      }

      if (availableWidth && labelSize) {
        label.style.transform = `scale(${availableWidth / labelSize})`;
      }
    });

    observer.observe(face);
    observer.observe(label);
    return () => observer.disconnect();
  }
</script>

<span class="gate-icon" class:hoverable class:custom={customGate}>
  {#if customGate?.image}
    <img class="artwork" src={customGate.image} alt="" draggable="false" />
  {:else if customGate}
    <span class="face" aria-hidden="true">
      <span class="label" {@attach fitGateLabel}>{customGate.symbol}</span>
    </span>
  {:else}
    <img src={gateImage(gate as Gate, useNotSymbol)} alt="" draggable="false" />
    {#if hoverable}
      <img
        class="hover"
        src={gateImage(gate as Gate, useNotSymbol, true)}
        alt=""
        draggable="false"
      />
    {/if}
  {/if}
</span>

<style>
  .gate-icon {
    display: block;
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
  }

  .hover {
    position: absolute;
    inset: 0;
    opacity: 0;
  }

  .custom {
    display: grid;
    place-items: center;
  }

  .custom::before {
    content: "";
    position: absolute;
    inset-inline: 0;
    top: calc(50% - 1px);
    height: 2px;
    background: #fff;
  }

  .face {
    position: relative;
    width: 80%;
    aspect-ratio: 1;
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    place-items: center;
    overflow: hidden;
    padding: 0.12rem;
    border: 2px solid #fff;
    border-radius: 0.2rem;
    background: var(--board);
  }

  .label {
    inline-size: max-content;
    font-size: 2.5rem;
    line-height: 1;
    white-space: nowrap;
    transform: scale(0);
  }

  .artwork {
    position: relative;
    width: 80%;
    height: 80%;
  }

  @media (hover: hover) {
    :global(button:hover) .hoverable .hover {
      opacity: 1;
    }

    :global(button:hover) .hoverable:not(.custom) > img:first-child {
      opacity: 0;
    }

    :global(button:hover) .custom.hoverable .face {
      background: #315357;
    }
  }
</style>
