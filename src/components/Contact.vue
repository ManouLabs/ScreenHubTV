<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';

const { t } = useI18n();

// Props
const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    errors: {
        type: Object,
        default: () => ({})
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'change']);

// Contact method types based on API enum
const contactMethodOptions = [
    { value: 'email', label: 'contact.types.email', icon: 'pi-envelope', validation: 'email' },
    { value: 'landline', label: 'contact.types.landline', icon: 'pi-phone', validation: 'landline' },
    { value: 'mobile', label: 'contact.types.mobile', icon: 'pi-mobile', validation: 'mobile' },
    { value: 'url', label: 'contact.types.url', icon: 'pi-globe', validation: 'url' }
];

// Civility options
const civilityOptions = [
    { value: 'Mr', label: 'contact.civility.mr' },
    { value: 'Mme', label: 'contact.civility.mme' }
];

// Local reactive data
const localContacts = ref([]);

// Initialize from props
const initializeContacts = () => {
    if (props.modelValue && props.modelValue.length > 0) {
        localContacts.value = [...props.modelValue];
    } else {
        localContacts.value = [createNewContact()];
    }
};

// Initialize on mount
initializeContacts();

// Watch for prop changes
watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue && JSON.stringify(newValue) !== JSON.stringify(localContacts.value)) {
            localContacts.value = [...newValue];
        }
    },
    { deep: true }
);

// Watch local changes and emit
watch(
    localContacts,
    (newValue) => {
        emit('update:modelValue', [...newValue]);
        emit('change', [...newValue]);
    },
    { deep: true }
);

// Validation errors
const errors = ref({});

// Helper function to create a new contact
function createNewContact() {
    return {
        civility: null,
        firstName: '',
        lastName: '',
        contactMethods: []
    };
}

// Validation schemas
const validationSchemas = {
    email: z.string().email({ message: 'contact.validation.invalid_email' }),
    landline: z.string().regex(/^0[2-4][0-9]{7}$/, { message: 'contact.validation.invalid_landline' }),
    mobile: z.string().regex(/^0[5-7][0-9]{8}$/, { message: 'contact.validation.invalid_mobile' }),
    url: z.string().url({ message: 'contact.validation.invalid_url' })
};

// Methods
const addContact = () => {
    localContacts.value.push(createNewContact());
};

const removeContact = (index) => {
    if (localContacts.value.length > 1) {
        localContacts.value.splice(index, 1);
    }
};

const addContactMethod = (contactIndex) => {
    const newMethod = {
        contact_id: null,
        type: 'email',
        value: ''
    };
    localContacts.value[contactIndex].contactMethods.push(newMethod);
};

const removeContactMethod = (contactIndex, methodIndex) => {
    localContacts.value[contactIndex].contactMethods.splice(methodIndex, 1);
};
</script>

<template>
    <div class="contacts-component">
        <!-- Add Contact Button -->
        <div class="flex justify-end mb-6">
            <Button icon="pi pi-plus" :label="t('contact.buttons.add_contact')" @click="addContact" outlined />
        </div>

        <!-- Contacts List -->
        <div class="space-y-6">
            <div v-for="(contact, contactIndex) in localContacts" :key="contactIndex" class="contact-card border rounded-lg p-6 bg-white shadow-sm">
                <!-- Remove Contact Button (for contacts beyond the first) -->
                <div v-if="localContacts.length > 1" class="flex justify-end mb-4">
                    <Button icon="pi pi-trash" @click="removeContact(contactIndex)" severity="danger" size="small" outlined :title="t('contact.buttons.remove_contact')" />
                </div>

                <!-- Contact Details -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <!-- Civility -->
                    <div class="flex flex-col">
                        <FloatLabel>
                            <Select
                                :modelValue="contact.civility"
                                :options="civilityOptions"
                                optionValue="value"
                                optionLabel="label"
                                class="w-full"
                                :placeholder="t('contact.labels.civility')"
                                :invalid="errors?.civility ? true : false"
                                @blur="validateForm"
                            />
                            <label :for="`civility_${contactIndex}`">{{ t('contact.labels.civility') }}</label>
                        </FloatLabel>
                        <ErrorMessage field="civility" :errors="errors" />
                    </div>

                    <!-- First Name -->
                    <div class="flex flex-col">
                        <FloatLabel>
                            <InputText :id="`firstName_${contactIndex}`" :modelValue="contact.firstName" :invalid="errors?.firstName ? true : false" :required="required" class="w-full" @blur="validateForm" />
                            <label :for="`firstName_${contactIndex}`">{{ t('contact.labels.first_name') }}</label>
                        </FloatLabel>
                        <ErrorMessage field="firstName" :errors="errors" />
                    </div>

                    <!-- Last Name -->
                    <div class="flex flex-col">
                        <FloatLabel>
                            <InputText :id="`lastName_${contactIndex}`" :modelValue="contact.lastName" :disabled="disabled" :invalid="errors?.lastName ? true : false" :required="required" class="w-full" @blur="validateForm" />
                            <label :for="`lastName_${contactIndex}`">{{ t('contact.labels.last_name') }}</label>
                        </FloatLabel>
                        <ErrorMessage field="lastName" :errors="errors" />
                    </div>
                </div>

                <!-- Contact Methods Section -->
                <div class="contact-methods">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-md font-medium">{{ t('contact.labels.contact_methods') }}</h4>
                        <Button icon="pi pi-plus" :label="t('contact.buttons.add_contact_method')" @click="addContactMethod(contactIndex)" size="small" outlined />
                    </div>

                    <div v-if="contact.contactMethods.length === 0" class="text-gray-500 text-center py-4">
                        {{ t('contact.messages.no_contact_methods') }}
                    </div>

                    <div v-else class="space-y-3">
                        <div v-for="(contactMethod, methodIndex) in contact.contactMethods" :key="methodIndex" class="contact-method-item border rounded-lg p-3 bg-gray-50">
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                <!-- Contact Type -->
                                <div class="md:col-span-3">
                                    <div class="flex flex-col">
                                        <FloatLabel>
                                            <Select
                                                :modelValue="contactMethod.type"
                                                :options="contactMethodOptions"
                                                optionValue="value"
                                                optionLabel="label"
                                                class="w-full"
                                                :invalid="errors?.[`contact_${contactIndex}_method_type_${methodIndex}`] ? true : false"
                                            />
                                            <label :for="`contact_method_type_${contactIndex}_${methodIndex}`">{{ t('contact.labels.contact_type') }}</label>
                                        </FloatLabel>
                                    </div>
                                </div>

                                <!-- Contact Value -->
                                <div class="md:col-span-7">
                                    <div class="flex flex-col">
                                        <InputText
                                            :modelValue="contactMethod.value"
                                            :placeholder="t(`contact.placeholders.${contactMethod.type}`)"
                                            :invalid="errors?.[`contact_${contactIndex}_method_value_${methodIndex}`] ? true : false"
                                            class="w-full"
                                            @blur="validateContactMethod(contactMethod, contactIndex, methodIndex)"
                                        />
                                        <ErrorMessage :field="`contact_${contactIndex}_method_value_${methodIndex}`" :errors="errors" />
                                    </div>
                                </div>

                                <!-- Remove Button -->
                                <div class="md:col-span-2 flex items-center justify-center">
                                    <Button icon="pi pi-trash" @click="removeContactMethod(contactIndex, methodIndex)" :disabled="disabled" severity="danger" size="small" outlined :title="t('contact.buttons.remove')" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
