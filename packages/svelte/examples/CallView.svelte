<!--
  A realistic, self-contained example component showing the full flow this
  package supports: create -> join -> render local + remote video -> toggle
  camera/mic -> leave -> destroy on unmount.

  This file is illustrative only (not built/exported by the package) — copy
  it into your app and adapt styling/markup as needed.
-->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createPurpleCallio, PurpleCallioVideo } from '@purplecallio/svelte';

  /**
   * `token` MUST be a short-lived participant token minted by YOUR OWN
   * backend (typically via @purplecallio/sdk's server-side
   * `PurpleCallioClient`). Never an API key, and never generated on-device.
   */
  export let token: string;
  export let callId: string;
  export let signalUrl: string;

  const call = createPurpleCallio({
    token,
    callId,
    signalUrl,
    video: true,
    audio: true,
  });

  // Each piece of state is its own store, so `$call.<field>` auto-subscribes.
  const { connectionState, participants, media, remoteStream, localStream } = call;

  let joining = false;
  let error: string | null = null;

  async function handleJoin() {
    joining = true;
    error = null;
    try {
      await call.join();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to join the call.';
    } finally {
      joining = false;
    }
  }

  async function handleLeave() {
    await call.leave();
  }

  // The factory isn't tied to this component's lifecycle automatically (it's
  // plain TypeScript, not a Svelte component) — always destroy it yourself.
  onDestroy(() => {
    call.destroy();
  });

  $: joined = $connectionState === 'connected' || $connectionState === 'joined';
</script>

<div class="call">
  <div class="video-area">
    <PurpleCallioVideo stream={$remoteStream} class="remote-video" />
    <PurpleCallioVideo stream={$localStream} muted class="local-preview" />
  </div>

  <p class="status">
    {$connectionState} · {$participants.length} participant{$participants.length === 1 ? '' : 's'}
  </p>
  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="controls">
    {#if !joined}
      <button on:click={handleJoin} disabled={joining}>
        {joining ? 'Joining…' : 'Join call'}
      </button>
    {:else}
      <button on:click={() => call.camera.toggle()}>
        {$media.camera ? 'Turn camera off' : 'Turn camera on'}
      </button>
      <button on:click={() => call.microphone.toggle()}>
        {$media.microphone ? 'Mute' : 'Unmute'}
      </button>
      <button on:click={handleLeave}>Leave</button>
    {/if}
  </div>
</div>

<style>
  .call {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .video-area {
    position: relative;
    aspect-ratio: 16 / 9;
    background: #0d1425;
    border-radius: 12px;
    overflow: hidden;
  }
  .video-area :global(.remote-video) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .video-area :global(.local-preview) {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 120px;
    height: 90px;
    border-radius: 8px;
    object-fit: cover;
  }
  .status {
    color: #64748b;
    font-size: 0.8rem;
  }
  .error {
    color: #dc2626;
    font-size: 0.8rem;
  }
  .controls {
    display: flex;
    gap: 0.5rem;
  }
</style>
