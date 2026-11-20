<script lang="ts">
  import type { Gate } from "@quantumq/core";
  import { gateImage } from "../assets";

  let {
    gate,
    useNotSymbol,
    hoverable = true,
  }: { gate: Gate; useNotSymbol: boolean; hoverable?: boolean } = $props();
</script>

<span class="gate-icon" class:hoverable>
  <img src={gateImage(gate, useNotSymbol)} alt="" draggable="false" />
  {#if hoverable}
    <img
      class="hover"
      src={gateImage(gate, useNotSymbol, true)}
      alt=""
      draggable="false"
    />
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

  @media (hover: hover) {
    :global(button:hover) .hoverable .hover {
      opacity: 1;
    }

    :global(button:hover) .hoverable img:first-child {
      opacity: 0;
    }
  }
</style>
