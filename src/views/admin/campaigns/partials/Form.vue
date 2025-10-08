<script setup>
import { useCampaignService } from '@/services/useCampaignService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS } from '@/utilities/toast';
import { campaignSchema } from '@/validations/campaign';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const loading = useLoading();
const record = ref({});
const dialogRef = inject('dialogRef');
const action = ref();

// Use external campaign schema
const schema = campaignSchema;

// Manual validation function using reusable helper
const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};

// Field-level validation on blur
const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};

// Handle form submission
const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useCampaignService.storeCampaign : (campaignData) => useCampaignService.updateCampaign(record.value.id, campaignData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
        })
        .finally(() => {
            loading.stopPageLoading();
        });
};

// Handle form cancellation
const handleCancel = () => {
    dialogRef.value.close();
};

onMounted(() => {
    record.value = dialogRef.value.data.record;
    action.value = dialogRef.value.data.action;
});
</script>

<template>
    <div class="p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Campaign Name -->
            <div class="field">
                <FloatLabel>
                    <InputText id="name" v-model="record.name" :class="{ 'p-invalid': authStore.errors?.name }" class="w-full" :maxlength="255" required @blur="onBlurField('name')" />
                    <label for="name">{{ t('campaign.fields.name') }} *</label>
                </FloatLabel>
                <small v-if="authStore.errors?.name" class="p-error">
                    {{ authStore.errors?.name?.[0] }}
                </small>
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Start Date -->
                <div class="field">
                    <FloatLabel>
                        <DatePicker id="start_date" v-model="record.start_date" :class="{ 'p-invalid': authStore.errors?.start_date }" class="w-full" dateFormat="yy-mm-dd" :showIcon="true" :showClear="true" @blur="onBlurField('start_date')" />
                        <label for="start_date">{{ t('campaign.fields.start_date') }}</label>
                    </FloatLabel>
                    <small v-if="authStore.errors?.start_date" class="p-error">
                        {{ authStore.errors?.start_date?.[0] }}
                    </small>
                </div>

                <!-- End Date -->
                <div class="field">
                    <FloatLabel>
                        <DatePicker
                            id="end_date"
                            v-model="record.end_date"
                            :class="{ 'p-invalid': authStore.errors?.end_date }"
                            class="w-full"
                            dateFormat="yy-mm-dd"
                            :showIcon="true"
                            :showClear="true"
                            :minDate="record.start_date"
                            @blur="onBlurField('end_date')"
                        />
                        <label for="end_date">{{ t('campaign.fields.end_date') }}</label>
                    </FloatLabel>
                    <small v-if="authStore.errors?.end_date" class="p-error">
                        {{ authStore.errors?.end_date?.[0] }}
                    </small>
                </div>
            </div>

            <!-- Default Media -->
            <div class="field">
                <FloatLabel>
                    <InputText id="default_media" v-model="record.default_media" :class="{ 'p-invalid': authStore.errors?.default_media }" class="w-full" :maxlength="255" @blur="onBlurField('default_media')" />
                    <label for="default_media">{{ t('campaign.fields.default_media') }}</label>
                </FloatLabel>
                <small v-if="authStore.errors?.default_media" class="p-error">
                    {{ authStore.errors?.default_media?.[0] }}
                </small>
            </div>

            <!-- Active Status -->
            <div class="field">
                <div class="flex items-center gap-3">
                    <ToggleSwitch id="active" v-model="record.active" :class="{ 'p-invalid': authStore.errors?.active }" @change="onBlurField('active')" />
                    <label for="active" class="font-medium">
                        {{ t('campaign.fields.active') }}
                    </label>
                </div>
                <small v-if="authStore.errors?.active" class="p-error">
                    {{ authStore.errors?.active?.[0] }}
                </small>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" :label="t('common.labels.cancel')" icon="pi pi-times" severity="secondary" outlined @click="handleCancel" :disabled="loading.isPageLoading" />
                <Button type="submit" :label="action === ACTIONS.CREATE ? t('common.labels.create') : t('common.labels.update')" :icon="action === ACTIONS.CREATE ? 'pi pi-plus' : 'pi pi-pencil'" severity="primary" :loading="loading.isPageLoading" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1.5rem;
}

.p-error {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #ef4444;
}

.p-invalid {
    border-color: #ef4444 !important;
}
</style>
