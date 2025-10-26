// src/stores/useScreenStore.js
import { defineStore } from 'pinia';

export const useScreenStore = defineStore('screen', {
    state: () => ({
        deviceId: null,
        locationId: null,
        groupId: null,
        screenNumber: null,
        online: null
    }),
    actions: {
        setDeviceId(id) {
            this.deviceId = id;
        },
        setLocation(id) {
            this.locationId = id;
            // reset group when location changes
            this.groupId = null;
        },
        setGroup(id) {
            this.groupId = id;
        },
        setScreenNumber(num) {
            this.screenNumber = num;
        },
        setOnline(status) {
            this.online = status;
        },
        reset() {
            this.deviceId = null;
            this.locationId = null;
            this.groupId = null;
            this.screenNumber = null;
        }
    },
    persist: {
        key: 'screen',
        paths: ['deviceId', 'locationId', 'groupId', 'screenNumber']
    }
});
