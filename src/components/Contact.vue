<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    disabled: {
        type: Boolean,
        default: false
    }
});
// Emits
const emit = defineEmits(['update:modelValue', 'change']);

// Contact method types based on API enum
const contactMethodOptions = [
    { value: 'email', label: t('contact.types.email'), icon: 'pi-envelope', validation: 'email' },
    { value: 'landline', label: t('contact.types.landline'), icon: 'pi-phone', validation: 'landline' },
    { value: 'mobile', label: t('contact.types.mobile'), icon: 'pi-mobile', validation: 'mobile' },
    { value: 'url', label: t('contact.types.url'), icon: 'pi-globe', validation: 'url' }
];

// Civility options
const civilityOptions = [
    { value: 'Mr', label: t('contact.civility.mr') },
    { value: 'Mme', label: t('contact.civility.mme') }
];

// Local reactive data
const localContacts = ref(props.modelValue);

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

// Helper function to create a new contact
function createNewContact() {
    return {
        civility: null,
        firstName: '',
        lastName: '',
        contact_methods: []
    };
}

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
    localContacts.value[contactIndex].contact_methods.push(newMethod);
};

const removeContactMethod = (contactIndex, methodIndex) => {
    localContacts.value[contactIndex].contact_methods.splice(methodIndex, 1);
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
                        <FloatLabel variant="on">
                            <Select
                                :id="`civility_${contactIndex}`"
                                v-model="contact.civility"
                                :disabled="disabled"
                                :options="civilityOptions"
                                optionValue="value"
                                optionLabel="label"
                                class="w-full"
                                :placeholder="t('contact.labels.civility')"
                                required
                            />
                            <label :for="`civility_${contactIndex}`">{{ t('contact.labels.civility') }}</label>
                        </FloatLabel>
                    </div>

                    <!-- First Name -->
                    <div class="flex flex-col">
                        <FloatLabel variant="on">
                            <InputText :id="`firstName_${contactIndex}`" v-model="contact.first_name" class="w-full" required />
                            <label :for="`firstName_${contactIndex}`">{{ t('contact.labels.first_name') }}</label>
                        </FloatLabel>
                    </div>

                    <!-- Last Name -->
                    <div class="flex flex-col">
                        <FloatLabel variant="on">
                            <InputText :id="`lastName_${contactIndex}`" v-model="contact.last_name" class="w-full" required />
                            <label :for="`lastName_${contactIndex}`">{{ t('contact.labels.last_name') }}</label>
                        </FloatLabel>
                    </div>
                </div>

                <!-- Contact Methods Section -->
                <div class="contact-methods">
                    <div class="flex justify-between items-center mb-4">
                        <Button icon="pi pi-plus" :label="t('contact.buttons.add_contact_method')" @click="addContactMethod(contactIndex)" size="small" outlined />
                    </div>

                    <div v-if="contact.contact_methods.length === 0" class="text-gray-500 text-center py-4">
                        {{ t('contact.messages.no_contact_methods') }}
                    </div>

                    <Fieldset :legend="t('contact.labels.contact_methods')" class="mb-4 bg-gray-500 p-4 rounded-lg">
                        <div v-if="contact.contact_methods.length > 0" class="space-y-3">
                            <div v-for="(contactMethod, methodIndex) in contact.contact_methods" :key="methodIndex">
                                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                    <!-- Contact Type -->
                                    <div class="md:col-span-3">
                                        <div class="flex flex-col">
                                            <FloatLabel variant="on">
                                                <Select
                                                    :id="`contact_method_type_${contactIndex}_${methodIndex}`"
                                                    v-model="contactMethod.type"
                                                    :disabled="disabled"
                                                    :options="contactMethodOptions"
                                                    optionValue="value"
                                                    optionLabel="label"
                                                    class="w-full"
                                                    required
                                                />
                                                <label :for="`contact_method_type_${contactIndex}_${methodIndex}`">{{ t('contact.labels.type') }}</label>
                                            </FloatLabel>
                                            <Message v-if="authStore.errors?.[`contacts.${contactIndex}.contact_methods.${methodIndex}.type`]?.[0]" severity="error" size="small">
                                                {{ authStore.errors?.[`contacts.${contactIndex}.contact_methods.${methodIndex}.type`]?.[0] }}
                                            </Message>
                                        </div>
                                    </div>

                                    <!-- Contact Value -->
                                    <div class="md:col-span-7">
                                        <div class="flex flex-col">
                                            <FloatLabel variant="on">
                                                <InputText
                                                    :id="`contact_method_value_${contactIndex}_${methodIndex}`"
                                                    v-model="contactMethod.value"
                                                    :disabled="disabled"
                                                    :placeholder="t(`contact.placeholders.${contactMethod.type}`)"
                                                    class="w-full"
                                                    required
                                                />
                                            </FloatLabel>
                                            <Message v-if="authStore.errors?.[`contacts.${contactIndex}.contact_methods.${methodIndex}.value`]?.[0]" severity="error" size="small">
                                                {{ authStore.errors?.[`contacts.${contactIndex}.contact_methods.${methodIndex}.value`]?.[0] }}
                                            </Message>
                                        </div>
                                    </div>

                                    <!-- Remove Button -->
                                    <div class="md:col-span-2 flex items-center justify-center">
                                        <Button icon="pi pi-trash" @click="removeContactMethod(contactIndex, methodIndex)" :disabled="disabled" severity="danger" size="small" outlined :title="t('contact.buttons.remove')" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-gray-500 text-center py-4">
                            {{ t('contact.messages.no_contact_methods') }}
                        </div>
                    </Fieldset>
                </div>
            </div>
        </div>
    </div>
</template>
