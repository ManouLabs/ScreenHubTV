<script setup>
import Contact from '@/components/Contact.vue';
import { useCustomerService } from '@/services/useCustomerService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { inject, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const { showToast } = useShowToast();
const loading = useLoading();
const record = ref({});
const dialogRef = inject('dialogRef');
const action = ref();
onMounted(() => {
    record.value = dialogRef.value.data.record;
    action.value = dialogRef.value.data.action;
});

// Handle contact changes
const handleContactChange = (contacts) => {
    record.contacts = contacts;
};

// Submit form
const onFormSubmit = () => {
    loading.startPageLoading();

    const serviceAction = action.value === ACTIONS.CREATE ? useCustomerService.storeCustomer : (customerData) => useCustomerService.updateCustomer(record.value.id, customerData);

    serviceAction(record.value)
        .then((response) => {
            showToast('success', action.value, 'customer', 'tr');
            dialogRef.value.close({ record: response.data, action: action.value });
        })
        .catch((error) => {
            authStore.processError(error, t('common.messages.error_occurred'));
            showToast('error', action.value, 'customer', 'tr');
        })
        .finally(() => {
            loading.stopPageLoading();
        });
};

const closeDialog = () => {
    dialogRef.value.close();
};
</script>
<template>
    <form @submit.prevent="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-2 gap-4 pt-2">
            <!-- Legal Name -->
            <div class="col-span-2">
                <FloatLabel variant="on" class="w-full">
                    <InputText id="legal_name" v-model="record.legal_name" :disabled="loading.isPageLoading" autofocus class="w-full" required />
                    <label for="legal_name">{{ t('customer.columns.legal_name') }}</label>
                </FloatLabel>
            </div>

            <!-- Trade Name -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputText id="trade_name" v-model="record.trade_name" :disabled="loading.isPageLoading" class="w-full" required />
                    <label for="trade_name">{{ t('customer.columns.trade_name') }}</label>
                </FloatLabel>
            </div>

            <!-- RC Number -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputText id="rc_number" v-model="record.rc_number" :disabled="loading.isPageLoading" class="w-full" />
                    <label for="rc_number">{{ t('customer.columns.rc_number') }}</label>
                </FloatLabel>
            </div>

            <!-- Address -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputText id="address" v-model="record.address" :disabled="loading.isPageLoading" class="w-full" />
                    <label for="address">{{ t('customer.columns.address') }}</label>
                </FloatLabel>
            </div>

            <!-- NIF -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputText id="nif" v-model="record.nif" :disabled="loading.isPageLoading" class="w-full" />
                    <label for="nif">{{ t('customer.columns.nif') }}</label>
                </FloatLabel>
            </div>

            <!-- NIS -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputText id="nis" v-model="record.nis" :disabled="loading.isPageLoading" class="w-full" />
                    <label for="nis">{{ t('customer.columns.nis') }}</label>
                </FloatLabel>
            </div>

            <!-- RIB -->
            <div>
                <FloatLabel variant="on" class="w-full">
                    <InputText id="rib" v-model="record.rib" :disabled="loading.isPageLoading" class="w-full" />
                    <label for="rib">{{ t('customer.columns.rib') }}</label>
                </FloatLabel>
            </div>

            <!-- Contacts Section -->
            <div class="col-span-2">
                <Divider align="center" type="dotted">
                    {{ t('contact.labels.contacts') }}
                </Divider>
                <Contact v-model="record.contacts" :disabled="loading.isPageLoading" @change="handleContactChange" />
            </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </form>
</template>
