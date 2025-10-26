<script setup>
import Echo from '@/services/EchoService';
import { useScreenService } from '@/services/useScreenService';
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// Reactive array of all screens from API
const screens = ref([]);

async function fetchScreens() {
    try {
        const data = await useScreenService.getScreens();
        screens.value = data.screens || data.data || data || [];
    } catch (e) {
        console.error('Failed to fetch screens', e);
    }
}

function subscribeScreensPresence() {
    Echo.join('presence.screens')
        .here((members) => {
            onlineScreens.value = members;
        })
        .joining((member) => {
            onlineScreens.value.push(member);
        })
        .leaving((member) => {
            onlineScreens.value = onlineScreens.value.filter((m) => m.deviceId !== member.deviceId);
        })
        .error?.((e) => console.error('presence error', e));
}

onMounted(() => {
    fetchScreens();
    subscribeScreensPresence();
});

onUnmounted(() => {
    Echo.leave('presence.screens');
});
</script>

<template>
    <div class="card">
        <h2 class="mb-3">{{ t('common.titles.manage', { entity: t('entity.screens') }) }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <div v-for="screen in allScreens" :key="screen.deviceId" class="screen-card border rounded p-4 shadow">
                <div class="font-bold text-lg">Device: {{ screen.deviceId }}</div>
                <div v-if="screen.location_id">Location: {{ screen.location_id }}</div>
                <div v-if="screen.group_id">Group: {{ screen.group_id }}</div>
                <div v-if="screen.screen_number">Screen #: {{ screen.screen_number }}</div>
                <div v-if="onlineScreens.some((s) => s.deviceId === screen.deviceId)" class="text-green-600 font-bold mt-2">Online</div>
                <div v-else class="text-gray-400 mt-2">Offline</div>
            </div>
            <div v-if="!allScreens.length" class="col-span-full text-center opacity-60 py-8">No screens found</div>
        </div>
    </div>
</template>

<style scoped>
.screen-card {
    background: #f9fafb;
}
</style>
