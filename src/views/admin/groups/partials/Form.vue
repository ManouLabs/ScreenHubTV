<script setup>
import { useGroupService } from '@/services/useGroupService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { groupSchema } from '@/validations/group';
import { validate, validateField } from '@/validations/validate';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const record = ref({});
const locationsOptions = ref([]);
const dialogRef = inject('dialogRef');
const action = ref();

// Use external group schema
const schema = groupSchema;

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

// Submit form
const onFormSubmit = () => {
    // Validate form before submission
    if (!validateForm()) {
        return;
    }

    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useGroupService.storeGroup : (groupData) => useGroupService.updateGroup(record.value.id, groupData);

    serviceAction(record.value)
        .then((response) => {
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'group', 'tr');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
};

const closeDialog = () => {
    dialogRef.value.close();
};

onMounted(() => {
    record.value = dialogRef.value.data.record;
    locationsOptions.value = dialogRef.value.data.locationsOptions;
    action.value = dialogRef.value.data.action;
});
</script>
<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-1 gap-4 pt-2">
            <!-- Name -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputText
                        id="name"
                        v-model="record.name"
                        :disabled="loading.isPageLoading"
                        autofocus
                        class="w-full"
                        :invalid="authStore.errors?.['name']?.[0] ? true : false"
                        @input="() => authStore.clearErrors([`name`])"
                        @blur="() => onBlurField('name')"
                    />
                    <label for="name">{{ t('group.columns.name') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['name']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['name']?.[0]) }}
                </Message>
            </div>

            <!-- Location -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <Dropdown
                        id="location_id"
                        v-model="record.location_id"
                        :options="locationsOptions"
                        optionLabel="name"
                        optionValue="id"
                        :disabled="loading.isPageLoading"
                        class="w-full"
                        :invalid="authStore.errors?.['location_id']?.[0] ? true : false"
                        @change="() => authStore.clearErrors([`location_id`])"
                        @blur="() => onBlurField('location_id')"
                    />
                    <label for="location_id">{{ t('group.columns.location') }} *</label>
                </FloatLabel>
                <Message v-if="authStore.errors?.['location_id']?.[0]" severity="error" size="small">
                    {{ t(authStore.errors?.['location_id']?.[0]) }}
                </Message>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </form>
</template>
