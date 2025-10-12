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
const uploadRef = ref(null);
const removeDefaultMedia = ref(false);
const dialogRef = inject('dialogRef');
const action = ref();
const schema = campaignSchema;
const validateForm = () => {
    const { ok, errors } = validate(schema, record.value);
    authStore.errors = ok ? {} : errors;
    return ok;
};
const onBlurField = (path) => {
    const { ok, errors } = validateField(schema, record.value, path);
    if (ok) {
        authStore.clearErrors([path]);
    } else {
        authStore.errors = { ...authStore.errors, ...errors };
    }
};
const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    loading.startPageLoading();
    const campaignData = { ...record.value };
    const formatDateYMD = (v) => {
        if (!v) return null;
        if (v instanceof Date) {
            const year = v.getFullYear();
            const month = String(v.getMonth() + 1).padStart(2, '0');
            const day = String(v.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        if (typeof v === 'string') return v;
        return null;
    };

    campaignData.start_date = formatDateYMD(campaignData.start_date);
    campaignData.end_date = formatDateYMD(campaignData.end_date);
    delete campaignData.__original_start_date;
    const selected = uploadRef.value?.getSelectedFiles?.() || [];
    const file = Array.isArray(selected) ? selected[0] : selected;
    const hasFile = file instanceof File;

    let submitData;
    if (hasFile) {
        submitData = new FormData();
        Object.keys(campaignData).forEach((key) => {
            const value = campaignData[key];
            if (key !== 'default_media' && value !== null && value !== undefined) {
                if (typeof value === 'boolean') {
                    submitData.append(key, value ? '1' : '0');
                } else {
                    submitData.append(key, value);
                }
            }
        });
        submitData.append('default_media', file);
        removeDefaultMedia.value = false;
    } else {
        delete campaignData.default_media;
        if (removeDefaultMedia.value) {
            campaignData._remove_default_media = true;
        }
        if (typeof campaignData.active === 'boolean') {
            campaignData.active = campaignData.active;
        }
        submitData = campaignData;
    }

    const serviceAction = action.value === ACTIONS.CREATE ? useCampaignService.storeCampaign : (data) => useCampaignService.updateCampaign(record.value.id, data);

    serviceAction(submitData)
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
const handleCancel = () => {
    dialogRef.value.close();
};

onMounted(() => {
    const original = dialogRef.value.data.record;
    try {
        record.value = structuredClone ? structuredClone(original) : JSON.parse(JSON.stringify(original));
    } catch {
        record.value = JSON.parse(JSON.stringify(original));
    }
    action.value = dialogRef.value.data.action;
    console.log('Record action:', record.value);
    if (!('default_media' in record.value)) {
        record.value.default_media = null;
    }
    const toDate = (v) => {
        if (!v) return null;
        if (v instanceof Date) return v;
        if (typeof v === 'string') {
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    };
    record.value.start_date = toDate(record.value.start_date) ?? record.value.start_date;
    record.value.end_date = toDate(record.value.end_date) ?? record.value.end_date;
    if (action.value !== ACTIONS.CREATE) {
        record.value.__original_start_date = record.value.start_date;
    }
});
const handleUploadSelect = () => {
    removeDefaultMedia.value = false;
};
const handleUploadRemove = (e) => {
    if (e && e.reason === 'existing') {
        removeDefaultMedia.value = true;
    }
};
</script>

<template>
    <div class="p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="field">
                <FloatLabel>
                    <InputText id="name" v-model="record.name" :class="{ 'p-invalid': authStore.errors?.name }" class="w-full" :maxlength="255" required @blur="onBlurField('name')" />
                    <label for="name">{{ t('campaign.fields.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name']?.[0]) }}
                </Message>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="field">
                    <FloatLabel>
                        <DatePicker id="start_date" v-model="record.start_date" :class="{ 'p-invalid': authStore.errors?.start_date }" class="w-full" dateFormat="yy-mm-dd" :showIcon="true" :showClear="true" @blur="onBlurField('start_date')" />
                        <label for="start_date">{{ t('campaign.fields.start_date') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['start_date']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['start_date']?.[0]) }}
                    </Message>
                </div>
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
                        <label for="end_date">{{ t('campaign.fields.end_date') }} *</label>
                    </FloatLabel>
                    <Message v-if="authStore.errors?.['end_date']?.[0]" severity="error" size="small">
                        {{ t(authStore.errors?.['end_date']?.[0]) }}
                    </Message>
                </div>
            </div>
            <FileUploadField
                ref="uploadRef"
                :modelValue="record.default_media"
                :label="t('campaign.fields.default_media')"
                accept=".jpg,.jpeg,.png,.bmp,.gif,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm"
                :multiple="false"
                :maxFileSize="1073741824"
                :error="authStore.errors?.['default_media']?.[0] ? t(authStore.errors?.['default_media']?.[0]) : null"
                :placeholder="t('campaign.fields.media_files_placeholder')"
                uploadMode="advanced"
                :previewWidth="120"
                :emitUpdate="false"
                @select="handleUploadSelect"
                @remove="handleUploadRemove"
                @blur="onBlurField('default_media')"
            />
            <div class="field">
                <div class="flex items-center gap-3">
                    <ToggleSwitch id="active" v-model="record.active" :class="{ 'p-invalid': authStore.errors?.active }" @change="onBlurField('active')" />
                    <label for="active" class="font-medium">
                        {{ t('campaign.fields.active') }}
                    </label>
                </div>
                <Message v-if="authStore.errors?.['active']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['active']?.[0]) }}
                </Message>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="handleCancel" />
                <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
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
