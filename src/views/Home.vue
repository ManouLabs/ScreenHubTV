<script setup>
import Echo from '@/services/EchoService';
import { useScreenService } from '@/services/useScreenService';
import { useScreenStore } from '@/stores/useScreenStore';
import ScreenOnboarding from '@/views/partials/ScreenOnboarding.vue';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const screenStore = useScreenStore();
const deviceId = computed(() => screenStore.deviceId);
const exist = ref(true);
const waitingForMedia = ref(false);

async function checkScreen() {
    if (!deviceId.value) {
        exist.value = false;
        return;
    }
    try {
        const screen = await useScreenService.getScreen(deviceId.value);
        if (screen && screen.deviceId) {
            screenStore.setDeviceId(screen.deviceId);
            screenStore.setLocationId(screen.location_id);
            screenStore.setGroupId(screen.group_id);
            screenStore.setScreenNumber(screen.screen_number);
            screenStore.setOnline(screen.online);
        }
        exist.value = !!screen;
        waitingForMedia.value = !!screen;
    } catch (e) {
        exist.value = false;
        waitingForMedia.value = false;
    }
}

function subscribe() {
    if (exist.value) {
        Echo.channel(`screen.${deviceId.value}`).listen('.DisplayMedia', (event) => {
            console.log('DisplayMedia received:', event);
            waitingForMedia.value = false;
        });
    }
}

onMounted(async () => {
    await checkScreen();
    subscribe();
});

onUnmounted(() => {
    Echo.leave(`screen.${deviceId.value}`);
});
</script>

<template>
    <ScreenOnboarding
        v-if="!exist"
        @done="
            async () => {
                await checkScreen();
                subscribe();
            }
        "
    />
    <template v-else>
        <Card v-if="waitingForMedia" class="mx-auto mt-24 max-w-md shadow-lg animate-pulse">
            <template #content>
                <div class="flex flex-col items-center justify-center py-10">
                    <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="4" fill="var(--surface-ground)" animationDuration="2s" />
                    <h2 class="mt-6 text-2xl font-bold text-primary">{{ t('screen.labels.waiting_for_media') }}</h2>
                    <p class="mt-2 text-gray-500">{{ t('screen.labels.device_ready') }}</p>
                    <div class="mt-8 w-full">
                        <div class="bg-gray-50 rounded-lg p-4 shadow-inner">
                            <div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                <div class="font-semibold">{{ t('screen.columns.device_id') }}:</div>
                                <div>{{ deviceId }}</div>
                                <div class="font-semibold">{{ t('screen.columns.location') }}:</div>
                                <div>{{ screenStore.locationId ?? '—' }}</div>
                                <div class="font-semibold">{{ t('screen.columns.group') }}:</div>
                                <div>{{ screenStore.groupId ?? '—' }}</div>
                                <div class="font-semibold">{{ t('screen.columns.screen_number') }}:</div>
                                <div>{{ screenStore.screenNumber ?? '—' }}</div>
                                <div class="font-semibold">{{ t('screen.columns.online') }}:</div>
                                <div>
                                    <span v-if="screenStore.online" class="text-green-600 font-bold">{{ t('screen.labels.online') }}</span>
                                    <span v-else class="text-red-500 font-bold">{{ t('screen.labels.offline') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
        <div v-if="!waitingForMedia && exist" class="text-center mt-24 text-xl text-green-600 font-semibold">{{ t('screen.labels.media_received') }}</div>
        <div v-if="!exist" class="text-center mt-24 text-xl text-red-600 font-semibold">{{ t('screen.labels.device_not_found') }}</div>
    </template>
</template>
