<script setup>
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import { useShowToast } from '@/utilities/toast';
import { ref } from 'vue';
const { showToast } = useShowToast();
const loading = useLoading();
const email = ref('');
const password = ref('');
const authStore = useAuthStore();

const loginUser = async () => {
    try {
        await authStore.login(email.value, password.value);
        authStore.redirectUser();
    } catch (error) {
        showToast('error', 'error', 'login', 'tc');
    }
};
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="flex flex-col items-center mb-6">
                            <img src="/demo/images/logo.svg" alt="ScreenHub Logo" class="w-32 mb-4" />
                            <h1 class="text-primary text-4xl font-bold dark:text-surface-0">ScreenHub</h1>
                            <p class="text-surface-500 dark:text-surface-400 text-sm">Broadcast smarter</p>
                        </div>
                    </div>
                    <form @submit.prevent="loginUser" class="flex flex-col gap-5">
                        <FloatLabel variant="on">
                            <IconField>
                                <InputIcon class="pi pi-at" />
                                <InputText id="email" type="email" class="w-full md:w-[30rem]" v-model="email" :invalid="authStore.errors.email ? true : false" required />
                            </IconField>
                            <label for="email">{{ $t('login.email') }}</label>
                            <Message v-if="authStore.errors.email" severity="error" size="small" variant="simple">{{ authStore.errors.email[0] }}</Message>
                        </FloatLabel>
                        <FloatLabel variant="on">
                            <IconField>
                                <InputIcon class="pi pi-key" />
                                <Password id="password" v-model="password" :toggleMask="true" class="mb-4" fluid :feedback="false" :invalid="authStore.errors.password ? true : false" required />
                            </IconField>
                            <label for="password">{{ $t('login.password') }}</label>
                            <Message v-if="authStore.errors.password" severity="error" size="small" variant="simple">{{ authStore.errors.password[0] }}</Message>
                        </FloatLabel>
                        <div class="-mt-4">
                            <span class="font-medium no-underline text-right cursor-pointer text-primary">{{ $t('login.forgot_password') }}</span>
                        </div>

                        <!-- Trigger loginUser method on form submission -->
                        <Button type="submit" :label="$t('login.sign_in')" class="w-full" :loading="loading.isPageLoading" icon="pi pi-lock" />
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
