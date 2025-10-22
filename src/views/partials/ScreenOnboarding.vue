<script setup>
import { useGroupService } from '@/services/useGroupService';
import { useLocationService } from '@/services/useLocationService';
import { useScreenService } from '@/services/useScreenService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useScreenStore } from '@/stores/useScreenStore';
import getDeviceId, { persistDeviceId } from '@/utilities/device-id';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { screenOnboardingSchema } from '@/validations/screen';
import { validate, validateField } from '@/validations/validate';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['done']);
const authStore = useAuthStore();
const loading = useLoading();
const { showToast } = useShowToast();
const { t } = useI18n();

const screenStore = useScreenStore();

// Follow the same pattern as other forms: a single record object
const record = ref({
    device_id: null,
    location_id: null,
    group_id: null,
    screen_number: 1
});

const locations = ref([]);
const groups = ref([]);
const loadingData = ref(false);
const groupsLoading = ref(false);

// Validation helpers
const schema = screenOnboardingSchema;
const buildPayload = () => ({
    device_id: record.value.device_id || '',
    group_id: Number(record.value.group_id),
    screen_number: Number(record.value.screen_number)
});
const validateForm = () => {
    const { ok, errors } = validate(schema, buildPayload());
    authStore.errors = ok ? {} : errors;
    return ok;
};
const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, buildPayload(), path);
    if (ok) authStore.clearErrors([path]);
    else authStore.errors = { ...authStore.errors, ...errors };
};

async function ensureDeviceId() {
    if (!record.value.device_id) {
        // Only compute locally for display; don't persist until backend accepts onboarding
        record.value.device_id = await getDeviceId();
    }
}

async function loadLocations() {
    try {
        const data = await useLocationService.getPublicLocations();
        // Expecting an array of locations
        locations.value = data.locations || data.data || data || [];
    } catch (e) {
        console.error('Failed to load locations', e);
    }
}

async function loadGroupsForLocation(locId) {
    if (!locId) {
        groups.value = [];
        return;
    }
    try {
        groupsLoading.value = true;
        const data = await useGroupService.getPublicGroups({ location_id: locId });
        // Expecting an array of groups
        groups.value = data.groups || data.data || data || [];
    } catch (e) {
        console.error('Failed to load groups', e);
    } finally {
        groupsLoading.value = false;
    }
}

async function init() {
    loadingData.value = true;
    // Do not pre-store device id; just display it if needed
    await ensureDeviceId();
    await loadLocations();
    loadingData.value = false;
}

// Explicit handlers (no watchers) to match existing form style
async function handleLocationChange() {
    authStore.clearErrors(['location_id']);
    record.value.group_id = null;
    await loadGroupsForLocation(record.value.location_id);
}

function handleGroupChange() {
    authStore.clearErrors(['group_id']);
}

function onFormSubmit() {
    if (!validateForm()) return;
    const payload = buildPayload();
    loading.startPageLoading();
    useScreenService
        .storeOnboarding(payload)
        .then(() => {
            // Persist locally only after successful server onboarding
            persistDeviceId(payload.device_id);
            screenStore.setDeviceId(payload.device_id);
            screenStore.setLocation(payload.location_id);
            screenStore.setGroup(payload.group_id);
            screenStore.setScreenNumber(payload.screen_number);
            showToast('success', ACTIONS.CREATE, 'screen', 'tc');
            emit('done');
        })
        .catch((error) => {
            authStore.processError?.(error, t('common.messages.error_occurred'));
            showToast('error', ACTIONS.CREATE, 'screen', 'tr');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
}

onMounted(init);
</script>

<template>
    <div class="card max-w-5xl mx-auto p-6">
        <h2 class="text-2xl md:text-3xl font-bold mb-6">Configure Screen</h2>

        <form @submit.prevent="onFormSubmit" class="flex flex-col gap-6">
            <!-- Device ID -->
            <div>
                <label class="text-base md:text-lg font-semibold mb-2 block">Device ID</label>
                <InputGroup class="text-lg">
                    <InputText :value="record.device_id || ''" readonly class="text-lg py-3" />
                    <InputGroupAddon>
                        <Button size="large" icon="pi pi-refresh" @click="ensureDeviceId" :disabled="!!record.device_id" />
                    </InputGroupAddon>
                </InputGroup>
                <small class="opacity-70">Stable identifier stored locally.</small>
                <Message v-if="authStore.errors?.['device_id']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['device_id']?.[0]) }}
                </Message>
            </div>

            <!-- Screen Number -->
            <div>
                <label for="screen-number" class="text-base md:text-lg font-semibold mb-2 block">Screen Number</label>
                <div class="flex items-center gap-3">
                    <InputNumber
                        id="screen-number"
                        v-model="record.screen_number"
                        :min="1"
                        :max="9999"
                        showButtons
                        buttonLayout="horizontal"
                        decrementButtonClass="p-button-outlined p-button-secondary"
                        incrementButtonClass="p-button-outlined p-button-secondary"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                        inputClass="text-lg py-3"
                        class="w-full"
                        placeholder="Enter a screen number"
                        @blur="() => onBlurField('screen_number')"
                    />
                </div>
                <small class="opacity-70">Use a number to identify this screen (e.g., 1, 2, 101).</small>
                <Message v-if="authStore.errors?.['screen_number']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['screen_number']?.[0]) }}
                </Message>
            </div>

            <!-- Location Picker: Big-screen List -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="text-base md:text-lg font-semibold">Location</label>
                    <Button v-if="record.location_id" size="small" label="Change" icon="pi pi-pencil" outlined @click="record.location_id = null" />
                </div>
                <div class="grid grid-cols-1 gap-3">
                    <Listbox v-model="record.location_id" :options="locations" optionLabel="name" optionValue="id" class="w-full text-lg" :listStyle="{ maxHeight: '40vh' }" :disabled="loadingData" @change="handleLocationChange">
                        <template #empty>
                            <div class="p-4 text-center opacity-70">No locations available</div>
                        </template>
                        <template #option="{ option, selected }">
                            <div class="flex items-center justify-between py-3 px-3">
                                <span class="text-xl">{{ option.name }}</span>
                                <i v-if="selected" class="pi pi-check text-xl"></i>
                            </div>
                        </template>
                    </Listbox>
                    <Message v-if="authStore.errors?.['location_id']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['location_id']?.[0]) }}
                    </Message>
                </div>
            </div>

            <!-- Group Picker: depends on Location -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="text-base md:text-lg font-semibold">Group</label>
                    <Button v-if="record.group_id" size="small" label="Change" icon="pi pi-pencil" outlined @click="record.group_id = null" />
                </div>
                <div class="grid grid-cols-1 gap-3">
                    <Listbox
                        v-model="record.group_id"
                        :options="groups"
                        optionLabel="name"
                        optionValue="id"
                        class="w-full text-lg"
                        :listStyle="{ maxHeight: '40vh' }"
                        :disabled="loadingData || groupsLoading || !record.location_id"
                        @change="handleGroupChange"
                    >
                        <template #empty>
                            <div class="p-4 text-center opacity-70">
                                <span v-if="groupsLoading">Loading groups…</span>
                                <span v-else>{{ record.location_id ? 'No groups available' : 'Select a location first' }}</span>
                            </div>
                        </template>
                        <template #option="{ option, selected }">
                            <div class="flex items-center justify-between py-3 px-3">
                                <span class="text-xl">{{ option.name }}</span>
                                <i v-if="selected" class="pi pi-check text-xl"></i>
                            </div>
                        </template>
                    </Listbox>
                    <Message v-if="authStore.errors?.['group_id']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['group_id']?.[0]) }}
                    </Message>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2">
                <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
            </div>
        </form>
    </div>
</template>
