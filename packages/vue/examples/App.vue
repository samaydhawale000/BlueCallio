<!--
  Ties the "fetch a token from your own backend" step to CallView.vue.
  Also documentation, not a build target (see CallView.vue's header comment).
-->
<script setup lang="ts">
import { ref } from 'vue';
import CallView from './CallView.vue';

const callId = 'demo-call-123';
const token = ref<string | null>(null);
const error = ref<string | null>(null);

// Your backend endpoint — it calls @purplecallio/sdk's server-side
// PurpleCallioClient (with your API key) to mint a short-lived participant
// token, and returns just that token to the client. The API key itself never
// leaves your server.
fetch(`/api/calls/${callId}/token`, { method: 'POST' })
  .then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch participant token (${res.status})`);
    return res.json();
  })
  .then((body: { token: string }) => {
    token.value = body.token;
  })
  .catch((err: unknown) => {
    error.value = err instanceof Error ? err.message : 'Failed to fetch participant token.';
  });
</script>

<template>
  <main>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="!token">Loading…</p>
    <!-- `:key` forces a remount (and so a fresh usePurpleCallio() call) if
         callId/token ever change while this component stays mounted. -->
    <CallView v-else :call-id="callId" :token="token" :key="`${callId}:${token}`" />
  </main>
</template>
