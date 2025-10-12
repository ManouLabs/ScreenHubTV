<script setup>
import { useDataTable } from '@/composables/useDataTable';
import { useDynamicColumns } from '@/composables/useDynamicColumns';
import { useHighlights } from '@/composables/useHighlights';
import { useLock } from '@/composables/useLock';
import dayjs from '@/plugins/dayjs';
import { useCampaignService } from '@/services/useCampaignService';
import { useAuthStore } from '@/stores/useAuthStore';
import { findRecordIndex, formatDate } from '@/utilities/helper';
import { getMediaName, getMediaUrl, isImageMedia, isVideoMedia } from '@/utilities/media';
import { ACTIONS, useShowToast } from '@/utilities/toast';
import { FilterMatchMode } from '@primevue/core/api';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

onMounted(() => {
    initialize();
    subscribeToEcho();
});

// Define default filters configuration for campaigns
const defaultFiltersConfig = {
    id: FilterMatchMode.CONTAINS,
    name: FilterMatchMode.CONTAINS,
    start_date: FilterMatchMode.DATE_IS,
    end_date: FilterMatchMode.DATE_IS,
    active: FilterMatchMode.EQUALS
};

// Initialize DataTable composable with campaign service
const { total, rows, records, selectedRecords, recordDataTable, filters, onPage, onSort, onFilter, clearFilter, searchDone, exportCSV, initialize } = useDataTable(
    (params) =>
        useCampaignService.getCampaigns(params).then((data) => ({
            data: data.campaigns,
            meta: data.meta
        })),
    defaultFiltersConfig
);

const authStore = useAuthStore();
const confirm = useConfirm();
const dialog = useDialog();
const formComponent = defineAsyncComponent(() => import('./partials/Form.vue'));
const { showToast } = useShowToast();
const { t } = useI18n();

// Use highlights composable
const { highlights, markHighlight, getRowClass } = useHighlights();

// Use DataTable locking composable (row locking + column freezing)
const defaultFields = ['name', 'start_date', 'end_date', 'default_media', 'active'];
const { lockedRow, toggleLock, frozenColumns, toggleColumnFrozen } = useLock(defaultFields, records);

const record = ref(null);

const defaultColumns = computed(() =>
    defaultFields.map((field) => ({
        field,
        header: t(`campaign.columns.${field}`)
    }))
);

const { selectedColumns, columnChanged } = useDynamicColumns('campaignsColumns', defaultFields, 'campaign.columns');

const subscription = ref(null);

function subscribeToEcho() {
    subscription.value = Echo.private('data-stream.campaign').listen('DataStream', (event) => {
        handleEchoEvent(event);
    });
}

function handleEchoEvent(event) {
    switch (event.action) {
        case ACTIONS.DELETE:
            handleDelete(event);
            break;
        case ACTIONS.UPDATE:
            handleUpdate(event);
            break;
        case ACTIONS.STORE:
            handleStore(event);
            break;
        case ACTIONS.TOGGLE:
            handleToggle(event);
            break;
        default:
            console.error(`Unhandled action: ${event.action}`);
    }
}

function handleDelete(event) {
    event.data.forEach((id) => {
        const index = findRecordIndex(records, id);
        if (index !== -1) {
            records.value.splice(index, 1);
        }
    });
}

function handleUpdate(event) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
        markHighlight(event.data.id, 'updated');
    }
}

function handleStore(event) {
    const exists = records.value.some((record) => record.id === event.data.id);
    if (!exists) {
        records.value.unshift(event.data);
        markHighlight(event.data.id, 'new');
    }
}

// Handle active status toggles broadcast from server (e.g., DataStream 'toggle')
function handleToggle(event) {
    const index = findRecordIndex(records, event.data.id);
    if (index !== -1) {
        records.value[index] = event.data;
        markHighlight(event.data.id, 'updated');
    }
}

function addRecord() {
    authStore.errors = {};
    record.value = {
        name: null,
        start_date: null,
        end_date: null,
        default_media: null,
        active: true
    };
    openDialog();
}

function editRecord(row) {
    authStore.errors = {};
    record.value = row;
    openDialog();
}

const openDialog = () => {
    dialog.open(formComponent, {
        props: {
            header: t('common.titles.add', { entity: t('entity.campaign') }),
            style: {
                width: '40vw'
            },
            breakpoints: {
                '960px': '75vw',
                '640px': '90vw'
            },
            modal: true,
            maximizable: true
        },
        data: {
            record: record.value,
            action: record.value.id ? ACTIONS.EDIT : ACTIONS.CREATE
        },
        onClose: (result) => {
            if (result && result.data?.record?.id) {
                switch (result.data?.action) {
                    case ACTIONS.CREATE:
                        records.value.unshift(result.data.record);
                        markHighlight(result.data.record.id, 'new');
                        showToast('success', ACTIONS.CREATE, 'campaign', 'tc');
                        break;
                    case ACTIONS.EDIT: {
                        const index = findRecordIndex(records, result.data.record.id);
                        records.value[index] = result.data.record;
                        markHighlight(result.data.record.id, 'updated');
                        showToast('success', ACTIONS.EDIT, 'campaign', 'tc');
                        break;
                    }
                    default:
                        console.error(`Unhandled action: ${result.action}`);
                }
            }
        }
    });
};

function confirmDeleteRecord(event, campaignIds) {
    confirm.require({
        modal: true,
        target: event.currentTarget,
        message: campaignIds.length > 1 ? t('common.confirmations.delete_selected.message', { entity: t('entity.campaigns') }) : t('common.confirmations.delete.message', { entity: t('entity.campaign') }),
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: t('common.labels.cancel'),
            severity: 'secondary',
            icon: 'pi pi-times',
            tooltip: t('common.labels.cancel'),
            outlined: true
        },
        acceptProps: {
            label: t('common.labels.delete'),
            icon: 'pi pi-trash',
            severity: 'danger'
        },
        accept: () => {
            useCampaignService
                .deleteCampaigns(campaignIds)
                .then(() => {
                    campaignIds.forEach((id) => {
                        const index = findRecordIndex(records, id);
                        if (index !== -1) {
                            records.value.splice(index, 1);
                        }
                    });
                    showToast('success', ACTIONS.DELETE, 'campaign', 'tc');
                })
                .catch((error) => {
                    if (error?.response?.status === 419 || error?.response?.status === 401) {
                        console.error('Session expired, redirecting to login');
                    }
                    console.error('Error deleting campaigns');
                });
        }
    });
}

function toggleActive(campaign) {
    useCampaignService
        .toggleCampaignActive(campaign.id)
        .then((updatedCampaign) => {
            const index = findRecordIndex(records, campaign.id);
            if (index !== -1) {
                records.value[index] = updatedCampaign.data;
                markHighlight(updatedCampaign.data.id, 'updated');
            }
            showToast('success', ACTIONS.EDIT, 'campaign', 'tc');
        })
        .catch((error) => {
            console.error('Error toggling campaign status:', error);
            showToast('error', 'status_update_failed', 'campaign', 'tc');
        });
}

onUnmounted(() => {
    if (subscription.value) {
        subscription.value.stopListening('DataStream');
    }
});
</script>

<template>
    <div>
        <div class="card">
            <DataTable
                ref="recordDataTable"
                lazy
                dataKey="id"
                v-model:selection="selectedRecords"
                :value="records"
                :rowClass="getRowClass"
                @filter="onFilter($event)"
                v-model:filters="filters"
                filterDisplay="menu"
                :globalFilterFields="('id', defaultColumns.map((column) => column.field))"
                paginator
                @page="onPage($event)"
                :rows="rows"
                :totalRecords="total"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50, 100]"
                :currentPageReportTemplate="t('common.paggination.showing_to_of_entity', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}', entity: t('entity.campaign') })"
                resizableColumns
                columnResizeMode="fit"
                reorderableColumns
                :frozenValue="lockedRow"
                sortField="id"
                :sortOrder="-1"
                @sort="onSort($event)"
                removableSort
                scrollable
                stripedRows
                rowHover
                size="small"
                :pt="{
                    table: { style: 'min-width: 50rem' },
                    bodyrow: ({ props }) => ({
                        class: [{ 'font-bold': props.frozenRow }]
                    })
                }"
            >
                <template #header>
                    <div class="flex items-center">
                        <h2 class="text-xl font-bold min-w-40">
                            {{ t('common.titles.manage', { entity: t('entity.campaign') }) }}
                        </h2>
                        <Toolbar class="w-full">
                            <template #start>
                                <div class="flex space-x-2">
                                    <Button
                                        v-if="authStore.hasPermission('store_campaign')"
                                        v-tooltip.top="t('common.tooltips.add', { entity: t('entity.campaign') })"
                                        :label="t('common.labels.new')"
                                        icon="pi pi-plus"
                                        severity="primary"
                                        @click="addRecord"
                                        outlined
                                    />
                                    <Button
                                        v-if="authStore.hasPermission('delete_campaign')"
                                        v-tooltip.top="t('common.tooltips.delete_selected', { entity: t('entity.campaign') })"
                                        :label="t('common.labels.delete_selected')"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        @click="
                                            confirmDeleteRecord(
                                                $event,
                                                selectedRecords.map((record) => record.id)
                                            )
                                        "
                                        outlined
                                        :disabled="!selectedRecords || !selectedRecords.length"
                                    />
                                    <Button v-tooltip.top="t('common.tooltips.clear_all_filters')" severity="secondary" type="button" icon="pi pi-filter-slash" :label="t('common.labels.clear_all_filters')" outlined @click="clearFilter()" />
                                </div>
                            </template>
                            <template #center>
                                <FloatLabel class="w-full" variant="on">
                                    <MultiSelect id="selected_columns" :modelValue="selectedColumns" display="chip" :maxSelectedLabels="4" :options="defaultColumns" optionLabel="header" @update:modelValue="columnChanged" />
                                    <label for="selected_columns">{{ t('common.placeholders.displayed_columns') }}</label>
                                </FloatLabel>
                            </template>
                            <template #end>
                                <div class="flex">
                                    <FloatLabel class="w-full" variant="on">
                                        <IconField>
                                            <InputIcon>
                                                <i class="pi pi-search" />
                                            </InputIcon>
                                            <InputText id="global_search" v-model="filters['global'].value" @keyup.enter="searchDone" />
                                            <label for="global_search">{{ t('common.placeholders.search') }}</label>
                                        </IconField>
                                    </FloatLabel>
                                    <Button
                                        v-if="authStore.hasPermission('export_campaign')"
                                        v-tooltip.top="t('common.tooltips.export_selection', { entity: t('entity.campaign') })"
                                        :label="t('common.labels.export')"
                                        icon="pi pi-upload"
                                        class="min-w-28 ml-2"
                                        outlined
                                        severity="info"
                                        @click="exportCSV($event)"
                                    />
                                </div>
                            </template>
                        </Toolbar>
                    </div>
                </template>

                <Column columnKey="select" selectionMode="multiple" style="width: 3rem" :exportable="false" :reorderableColumn="false" />

                <Column columnKey="id" field="id" header="ID" sortable class="min-w-32">
                    <template #body="{ data }">
                        <DataCell>{{ data.id }}</DataCell>
                    </template>
                </Column>

                <!-- Name Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="name"
                    field="name"
                    :frozen="frozenColumns.name"
                    v-if="selectedColumns.some((column) => column.field === 'name')"
                    sortable
                    class="min-w-48"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.name }">{{ t('campaign.columns.name') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.name ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.name ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('name')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.name || highlights[data.id] }">
                                <span>{{ data.name }}</span>
                                <Tag v-if="highlights[data.id] === 'new'" value="NEW" severity="success" rounded size="small" />
                                <Tag v-else-if="highlights[data.id] === 'updated'" value="UPDATED" severity="info" rounded size="small" />
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <InputText v-model="filterModel.value" size="small" />
                            <InputGroupAddon>
                                <Button size="small" v-tooltip.top="t('common.labels.apply')" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="!filterModel.value" size="small" v-tooltip.top="t('common.labels.clear')" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>

                <!-- Start Date Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    dataType="date"
                    columnKey="start_date"
                    field="start_date"
                    :frozen="frozenColumns.start_date"
                    v-if="selectedColumns.some((column) => column.field === 'start_date')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.start_date }">{{ t('campaign.columns.start_date') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.start_date ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.start_date ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('start_date')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.start_date }">
                                {{ data.start_date ? dayjs(data.start_date).format('L') : '-' }}
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <div class="flex flex-col gap-2">
                            <Dropdown
                                v-model="filterModel.matchMode"
                                :options="[
                                    { label: t('primevue.dateIs'), value: FilterMatchMode.DATE_IS },
                                    { label: t('primevue.dateBefore'), value: FilterMatchMode.DATE_BEFORE },
                                    { label: t('primevue.dateAfter'), value: FilterMatchMode.DATE_AFTER },
                                    { label: t('primevue.dateIsNot'), value: FilterMatchMode.DATE_IS_NOT }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                                placeholder="Filter Mode"
                            />
                            <InputGroup>
                                <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" :showClear="false" :manualInput="false" @dateSelect="(e) => formatDate(e, filterModel)" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="danger"
                                        outlined
                                        :disabled="!filterModel.value"
                                        @click="
                                            (() => {
                                                filterModel.value = null;
                                                applyFilter();
                                            })()
                                        "
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>

                <!-- End Date Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    dataType="date"
                    columnKey="end_date"
                    field="end_date"
                    :frozen="frozenColumns.end_date"
                    v-if="selectedColumns.some((column) => column.field === 'end_date')"
                    sortable
                    class="min-w-40"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.end_date }">{{ t('campaign.columns.end_date') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.end_date ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.end_date ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('end_date')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div :class="{ 'font-bold': frozenColumns.end_date }">
                                {{ data.end_date ? dayjs(data.end_date).format('L') : '-' }}
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <div class="flex flex-col gap-2">
                            <Dropdown
                                v-model="filterModel.matchMode"
                                :options="[
                                    { label: t('primevue.dateIs'), value: FilterMatchMode.DATE_IS },
                                    { label: t('primevue.dateBefore'), value: FilterMatchMode.DATE_BEFORE },
                                    { label: t('primevue.dateAfter'), value: FilterMatchMode.DATE_AFTER },
                                    { label: t('primevue.dateIsNot'), value: FilterMatchMode.DATE_IS_NOT }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                                placeholder="Filter Mode"
                            />
                            <InputGroup>
                                <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" :showClear="false" :manualInput="false" @dateSelect="(e) => formatDate(e, filterModel)" />
                                <InputGroupAddon>
                                    <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="danger"
                                        outlined
                                        :disabled="!filterModel.value"
                                        @click="
                                            (() => {
                                                filterModel.value = null;
                                                applyFilter();
                                            })()
                                        "
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </template>
                </Column>

                <!-- Default Media Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="default_media"
                    field="default_media"
                    :frozen="frozenColumns.default_media"
                    v-if="selectedColumns.some((column) => column.field === 'default_media')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.default_media }">{{ t('campaign.columns.default_media') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.default_media ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.default_media ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('default_media')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-3" :class="{ 'font-bold': frozenColumns.default_media }">
                                <template v-if="data.default_media">
                                    <template v-if="isImageMedia(data.default_media)">
                                        <Image :src="getMediaUrl(data.default_media)" :alt="getMediaName(data.default_media)" imageStyle="width: 64px; height: 64px; object-fit: cover; border-radius: 0.375rem;" preview />
                                    </template>
                                    <template v-else-if="isVideoMedia(data.default_media)">
                                        <div class="relative" style="width: 64px; height: 64px">
                                            <video :src="getMediaUrl(data.default_media)" preload="metadata" muted playsinline style="width: 64px; height: 64px; object-fit: cover; border-radius: 0.375rem"></video>
                                            <i class="pi pi-play absolute inset-0 m-auto text-white text-sm flex items-center justify-center" style="filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))"></i>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <a :href="getMediaUrl(data.default_media)" target="_blank" rel="noopener" class="text-primary-500 truncate max-w-40" :title="getMediaName(data.default_media)">{{
                                            getMediaName(data.default_media) || getMediaUrl(data.default_media)
                                        }}</a>
                                    </template>
                                </template>
                                <template v-else>
                                    <span>-</span>
                                </template>
                            </div>
                        </DataCell>
                    </template>
                </Column>

                <!-- Active Status Column -->
                <Column
                    :showClearButton="false"
                    :showApplyButton="false"
                    :showFilterMatchModes="false"
                    :showFilterOperator="false"
                    columnKey="active"
                    field="active"
                    :frozen="frozenColumns.active"
                    v-if="selectedColumns.some((column) => column.field === 'active')"
                    sortable
                    class="min-w-32"
                >
                    <template #header>
                        <div class="flex justify-between w-full items-center">
                            <div :class="{ 'font-bold': frozenColumns.active }">{{ t('campaign.columns.active') }}</div>
                            <Button
                                v-tooltip.top="frozenColumns.active ? t('common.tooltips.unlock_column') : t('common.tooltips.lock_column')"
                                :icon="frozenColumns.active ? 'pi pi-lock' : 'pi pi-lock-open'"
                                text
                                @click="toggleColumnFrozen('active')"
                                severity="contrast"
                            />
                        </div>
                    </template>
                    <template #body="{ data }">
                        <DataCell>
                            <div class="flex items-center gap-2" :class="{ 'font-bold': frozenColumns.active }">
                                <Tag
                                    :value="data.active ? t('common.labels.active') : t('common.labels.inactive')"
                                    :severity="data.active ? 'success' : 'danger'"
                                    :icon="data.active ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                                    rounded
                                    size="small"
                                    :pt="{ root: { class: authStore.hasPermission('update_campaign') ? 'cursor-pointer' : '' } }"
                                    @click="authStore.hasPermission('update_campaign') && toggleActive(data)"
                                />
                            </div>
                        </DataCell>
                    </template>
                    <template #filter="{ filterModel, applyFilter }">
                        <InputGroup>
                            <Dropdown
                                v-model="filterModel.value"
                                :options="[
                                    { label: t('common.labels.active'), value: true },
                                    { label: t('common.labels.inactive'), value: false }
                                ]"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Status"
                                class="w-full"
                                size="small"
                            />
                            <InputGroupAddon>
                                <Button size="small" icon="pi pi-check" severity="primary" @click="applyFilter()" />
                                <Button :disabled="filterModel.value === null" size="small" outlined icon="pi pi-times" severity="danger" @click="((filterModel.value = null), applyFilter())" />
                            </InputGroupAddon>
                        </InputGroup>
                    </template>
                </Column>

                <!-- Actions Column -->
                <Column columnKey="actions" :exportable="false" style="min-width: 12rem" :header="t('common.columns.actions')">
                    <template #body="{ data, frozenRow, index }">
                        <DataCell>
                            <div class="flex justify-between">
                                <div class="flex space-x-2">
                                    <Button
                                        v-if="authStore.hasPermission('view_campaign')"
                                        v-tooltip.top="t('common.tooltips.view', { entity: t('entity.campaign') })"
                                        icon="pi pi-eye"
                                        outlined
                                        rounded
                                        @click="editRecord(data)"
                                        severity="secondary"
                                    />
                                    <Button v-if="authStore.hasPermission('update_campaign')" v-tooltip.top="t('common.tooltips.edit', { entity: t('entity.campaign') })" icon="pi pi-pencil" outlined rounded @click="editRecord(data)" />
                                    <Button
                                        v-if="authStore.hasPermission('delete_campaign')"
                                        v-tooltip.top="t('common.tooltips.delete', { entity: t('entity.campaign') })"
                                        icon="pi pi-trash"
                                        outlined
                                        rounded
                                        severity="danger"
                                        @click="confirmDeleteRecord($event, [data.id])"
                                    />
                                </div>
                                <Button
                                    v-tooltip.top="frozenRow ? t('common.tooltips.unlock_row') : t('common.tooltips.lock_row')"
                                    :icon="frozenRow ? 'pi pi-lock' : 'pi pi-lock-open'"
                                    text
                                    @click="toggleLock(data, frozenRow, index)"
                                    severity="contrast"
                                />
                            </div>
                        </DataCell>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
