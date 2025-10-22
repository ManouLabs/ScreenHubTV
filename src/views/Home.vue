<script setup>
import Echo, { joinPresence } from '@/services/EchoService';
import { useScreenStore } from '@/stores/useScreenStore';
import ScreenOnboarding from '@/views/partials/ScreenOnboarding.vue';
import { computed, onMounted, onUnmounted } from 'vue';

let channel = null;
const screenStore = useScreenStore();
const isConfigured = computed(() => !!screenStore.deviceId);
const channelSlug = computed(() => (isConfigured.value ? `screens.${screenStore.deviceId}` : 'zones.lobby'));

onMounted(async () => {
    // If already configured from a previous session, subscribe immediately
    console.log('isConfigured', isConfigured.value, 'channel', `presence.${channelSlug.value}`);
    if (isConfigured.value) {
        channel = joinPresence(`presence.${channelSlug.value}`)
            .here(() => {
                console.log('subscribed', { deviceId: screenStore.deviceId });
            })
            .error?.((e) => console.error('presence error', e));
    }
});

onUnmounted(() => {
    Echo.leave(`presence.${channelSlug.value}`);
});
</script>

<template>
    <ScreenOnboarding
        v-if="!isConfigured"
        @done="
            () => {
                // After saving, subscribe
                channel = joinPresence(`presence.${channelSlug}`)
                    .here(() => {
                        console.log('subscribed', { deviceId: screenStore.deviceId });
                    })
                    .error?.((e) => console.error('presence error', e));
            }
        "
    />
    <template v-else></template>
</template>
