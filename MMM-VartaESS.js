"use strict";
/* global Module */

/* Magic Mirror
 * Module: MMM-VartaESS
 *
 * By Beh (hello@beh.wtf)
 * MIT Licensed.
 */

Module.register("MMM-VartaESS", {
    defaults: {
        name: "MMM-VartaESS",
        header: "Energy Storage",
        hidden: false,
        ip: "192.168.0.55",
        port: 502,
        clientId: 10,
        updateInterval: 3000,
        width: 250,
        showBatteryDisplay: true,
        colors: true,
        wattConversionOptions: {
            enabled: true,
            threshold: 1200,
            numDecimalDigits: 2,
        },
        broadcastBatteryPower: false,
        broadcastGridPower: false,
    },

    requiresVersion: "2.1.0", // Required version of MagicMirror

    start: function () {
        this.data.header = this.config.header;
        this.currentData = null;
        this.scheduleTimer = null;
        this.loaded = false;
        this.error = null;

        this.sendSocketNotification("MMM-VartaESS_INIT", this.config);

        Log.info("MMM-VartaESS started.");
    },

    getDom: function () {
        // create element wrapper for show into the module
        const wrapper = document.createElement("div");
        wrapper.id = "vartaess-wrapper";
        wrapper.style.width = `${this.config.width}px`;

        if (this.currentData === null && !this.loaded) {
            wrapper.className = "small light dimmed";
            wrapper.innerHTML = `${this.translate("LOADING")}...`;
            return wrapper;
        }

        if (this.error !== null && !this.loaded) {
            wrapper.className = "small light dimmed";
            wrapper.innerHTML = `${this.translate(this.error)}...`;
            return wrapper;
        }

        if (this.config.showBatteryDisplay) {
            const batteryDisplay = this.getBatteryDisplay();
            wrapper.appendChild(batteryDisplay);
        }

        // Table for displaying Values
        const tableWrapper = document.createElement("div");
        tableWrapper.id = "table-wrapper";
        const table = this.generateDataTable();
        tableWrapper.appendChild(table);

        wrapper.appendChild(tableWrapper);

        return wrapper;
    },

    generateDataTable: function () {
        const table = document.createElement("table");

        const stateDescription = `${this.translate("STATE")}:`;
        let stateValue = this.translate(this.currentData.state);
        if (this.error !== null) {
            stateValue = this.translate(this.error);
        }
        this.appendTableRow(stateDescription, stateValue, table);

        const socDescription = `${this.translate("CHARGE")}:`;
        const socValue = `${this.currentData.soc} %`;
        this.appendTableRow(socDescription, socValue, table);

        const gridPowerDescription = `${this.translate("GRID")}: `;
        const gpValue = this.currentData.gridPower;
        const gridPowerValue = `${this.getWattString(Math.abs(gpValue))} (${
            gpValue < 0 ? this.translate("CONSUMPTION_FROM_GRID") : this.translate("BACKFEED_TO_GRID")
        })`;
        this.appendTableRow(gridPowerDescription, gridPowerValue, table);

        const activePowerDescription = `${this.translate("BATTERY")}:`;
        let batteryChargingStateLabel = "";
        const apValue = this.currentData.activePower;
        if (apValue !== 0) {
            batteryChargingStateLabel = ` (${
                apValue < 0 ? this.translate("BATTERY_DISCHARGE") : this.translate("BATTERY_CHARGE")
            })`;
        }
        const activePowerValue = `${this.getWattString(Math.abs(apValue))}${batteryChargingStateLabel}`;
        this.appendTableRow(activePowerDescription, activePowerValue, table);

        return table;
    },

    appendTableRow: function (description, value, table) {
        const row = document.createElement("tr");

        const descriptionColumn = document.createElement("td");
        descriptionColumn.textContent = description;
        row.appendChild(descriptionColumn);

        const valueColumn = document.createElement("td");
        valueColumn.textContent = value;
        row.appendChild(valueColumn);

        table.appendChild(row);
    },

    getBatteryDisplay: function () {
        const batteryWrapper = document.createElement("div");
        batteryWrapper.id = "battery-wrapper";
        // Battery should have 85% of module width
        const wrapperWidth = Math.round(this.config.width * 0.85);
        batteryWrapper.style.width = `${wrapperWidth}px`;

        const batteryState = document.createElement("div");
        batteryState.id = "battery-state";

        const soc = this.currentData.soc;

        if (this.config.colors) {
            if (soc < 25) {
                batteryState.classList.add("battery-state-red");
            } else if (soc < 75) {
                batteryState.classList.add("battery-state-yellow");
            } else {
                batteryState.classList.add("battery-state-green");
            }
        }

        // Internal display should also narrower than battery to preserve internal border
        // Calculation from right: 8px "battery nose" + 4px border + 5px internal border = 17px
        const maxWidth = wrapperWidth - 18; // Dunno, why 18 seems to look light. 1px got lost somewhere, maybe while rounding
        const factor = soc / 100;
        const width = Math.round(maxWidth * factor);
        batteryState.style.width = `${width}px`;

        // We  will leave this here for debugging
        // Log.info(`Module width: ${this.config.width} | wrapper width: ${wrapperWidth} | width: ${width} | maxWidth: ${maxWidth} | factor: ${factor}`);

        batteryWrapper.appendChild(batteryState);

        return batteryWrapper;
    },

    getWattString: function (value) {
        const wattConversionOptions = this.config.wattConversionOptions;
        if (wattConversionOptions.enabled && value > wattConversionOptions.threshold) {
            return `${(value / 1000).toFixed(wattConversionOptions.numDecimalDigits)} KW`;
        }

        return `${value} W`;
    },

    getStyles: function () {
        return ["MMM-VartaESS.css"];
    },

    // Load translations files
    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json",
        };
    },

    // socketNotificationReceived from helper
    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-VartaESS_INITIALIZED") {
            this.loaded = true;
        }

        if (notification === "MMM-VartaESS_ERROR") {
            this.error = payload;
            this.updateDom();
        }

        if (notification === "MMM-VartaESS_DATA") {
            if (this.config.broadcastBatteryPower) {
                this.sendNotification("MMM-EnergyMonitor_ENERGY_STORAGE_POWER_UPDATE", payload.activePower);
            }

            if (this.config.broadcastGridPower) {
                this.sendNotification("MMM-EnergyMonitor_GRID_POWER_UPDATE", payload.gridPower);
            }

            this.error = null;
            this.currentData = payload;
            this.updateDom();
        }
    },
});
