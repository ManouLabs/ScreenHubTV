<script setup>
import { useCustomerService } from '@/services/useCustomerService';
import { useLoading } from '@/stores/useLoadingStore';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { inject, ref } from 'vue';
import { z } from 'zod';
const { showToast } = useShowToast();
const loading = useLoading();
const dialogRef = inject('dialogRef');
const action = ref();

const initialValues = {
    legal_name: '',
    trade_name: '',
    rc_number: '',
    address: '',
    nif: '',
    nis: '',
    rib: '',
    contacts: []
};

const resolver = zodResolver(
    z.object({
        legal_name: z.string().min(1, { message: 'customer.validation.legal_name_required' }),
        trade_name: z.string().min(1, { message: 'customer.validation.trade_name_required' }),
        rc_number: z.string().min(1, { message: 'customer.validation.rc_number_required' }),
        address: z.string().min(1, { message: 'customer.validation.address_required' }),
        nif: z.string().min(1, { message: 'customer.validation.nif_required' }),
        nis: z.string().min(1, { message: 'customer.validation.nis_required' }),
        rib: z.string().min(1, { message: 'customer.validation.rib_required' })
    })
);

const onFormSubmit = ({ valid, values }) => {
    if (valid) {
        loading.startPageLoading();

        // Transform contacts back to API format
        const formData = {
            ...values,
            contacts: initialValues.contacts.map((contact) => ({
                id: contact.id,
                civility: contact.civility,
                first_name: contact.firstName,
                last_name: contact.lastName,
                contact_methods: (contact.contactMethods || []).map((method) => ({
                    id: method.id,
                    contact_id: method.contact_id,
                    type: method.type,
                    value: method.value
                }))
            }))
        };

        const serviceAction = action.value === ACTIONS.CREATE ? useCustomerService.storeCustomer : (customerData) => useCustomerService.updateCustomer(initialValues.id, customerData);

        serviceAction(formData)
            .then((response) => {
                showToast('success', action.value, 'customer', 'tr');
                dialogRef.value.close({ record: response.data, action: action.value });
            })
            .catch((error) => {
                if (error.response?.status === 422) {
                    // Handle validation errors - they will be displayed by FormField
                    console.error('Validation errors:', error.response.data.errors);
                }
                showToast('error', action.value, 'customer', 'tr');
            })
            .finally(() => {
                loading.stopPageLoading();
            });
    }
};

const closeDialog = () => {
    dialogRef.value.close();
};
</script>
<template>
    <Form :validateOnBlur="true" :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="flex flex-col space-y-4">
        <div class="grid grid-cols-2 gap-4 pt-2">
            <div class="col-span-2">
                <FormField v-slot="$field" name="legal_name" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <InputText id="legal_name" name="legal_name" v-bind="$field" :disabled="loading.isPageLoading" autofocus class="w-full" />
                        <label for="legal_name">{{ $t('customer.columns.legal_name') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid" severity="error" size="small">
                        {{ $field.error?.message ? $t($field.error.message) : $field.error }}
                    </Message>
                </FormField>
            </div>
            <div>
                <FormField v-slot="$field" name="trade_name" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <InputText id="trade_name" name="trade_name" v-bind="$field" :disabled="loading.isPageLoading" class="w-full" />
                        <label for="trade_name">{{ $t('customer.columns.trade_name') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid" severity="error" size="small">
                        {{ $field.error?.message ? $t($field.error.message) : $field.error }}
                    </Message>
                </FormField>
            </div>
            <div>
                <FormField v-slot="$field" name="rc_number" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <InputText id="rc_number" name="rc_number" v-bind="$field" :disabled="loading.isPageLoading" class="w-full" />
                        <label for="rc_number">{{ $t('customer.columns.rc_number') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid" severity="error" size="small">
                        {{ $field.error?.message ? $t($field.error.message) : $field.error }}
                    </Message>
                </FormField>
            </div>
            <div>
                <FormField v-slot="$field" name="address" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <InputText id="address" name="address" v-bind="$field" :disabled="loading.isPageLoading" class="w-full" />
                        <label for="address">{{ $t('customer.columns.address') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid" severity="error" size="small">
                        {{ $field.error?.message ? $t($field.error.message) : $field.error }}
                    </Message>
                </FormField>
            </div>
            <div>
                <FormField v-slot="$field" name="nif" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <InputText id="nif" name="nif" v-bind="$field" :disabled="loading.isPageLoading" class="w-full" />
                        <label for="nif">{{ $t('customer.columns.nif') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid" severity="error" size="small">
                        {{ $field.error?.message ? $t($field.error.message) : $field.error }}
                    </Message>
                </FormField>
            </div>
            <div>
                <FormField v-slot="$field" name="nis" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <InputText id="nis" name="nis" v-bind="$field" :disabled="loading.isPageLoading" class="w-full" />
                        <label for="nis">{{ $t('customer.columns.nis') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid" severity="error" size="small">
                        {{ $field.error?.message ? $t($field.error.message) : $field.error }}
                    </Message>
                </FormField>
            </div>
            <div>
                <FormField v-slot="$field" name="rib" class="w-full">
                    <FloatLabel variant="on" class="w-full">
                        <InputText id="rib" name="rib" v-bind="$field" :disabled="loading.isPageLoading" class="w-full" />
                        <label for="rib">{{ $t('customer.columns.rib') }}</label>
                    </FloatLabel>
                    <Message v-if="$field.invalid" severity="error" size="small">
                        {{ $field.error?.message ? $t($field.error.message) : $field.error }}
                    </Message>
                </FormField>
            </div>

            <div class="col-span-2">
                <Divider align="center" type="dotted">
                    {{ $t('contact.labels.contacts') }}
                </Divider>
                <!-- <Contact v-model="initialValues.contacts" :disabled="loading.isPageLoading" @change="handleContactChange" /> -->
            </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
            <Button :label="$t('common.labels.cancel')" icon="pi pi-times" text @click="closeDialog" />
            <Button :label="$t('common.labels.save')" icon="pi pi-check" type="submit" :loading="loading.isPageLoading" />
        </div>
    </Form>
</template>
