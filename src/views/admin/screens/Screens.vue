<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
    <div class="card">
        <h2 class="mb-3">{{ t('common.titles.manage', { entity: t('entity.screens') }) }}</h2>
        <p class="text-sm text-surface-500">This is a placeholder for Screens management.</p>
    </div>
</template>

<style scoped></style>
