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
        header: "Varta Energy Storage",
        hidden: false,
        ip: "192.168.200.195",
        port: 502,
		updateInterval: 3000,
        width: 250,
        showBatteryDisplay: true,
        kwConversionOptions: {
            enabled: true,
            thresholdWatts: 1200,
            numDecimalDigits: 2
        }
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
        this.data.header = this.config.header;
		this.currentData = null;
		this.loaded = false;

        this.sendSocketNotification("MMM-VartaESS_INIT", this.config);

        Log.info("MMM-VartaESS started.")
	},

	scheduleUpdate: function() {
		setInterval(() => {
			this.sendSocketNotification("MMM-VartaESS_FETCH_DATA");
		}, this.config.updateInterval);
	},

	getDom: function() {
		// create element wrapper for show into the module
		const wrapper = document.createElement("div");
        wrapper.id = "vartaess-wrapper";
        wrapper.style.width = `${this.config.width}px`;

        if(this.currentData === null && !this.loaded) {
            wrapper.className = "small light dimmed";
            wrapper.innerHTML = `${this.translate("LOADING")}...`;
            return wrapper;
        }

        // Battery
        if(this.config.showBatteryDisplay) {
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

    generateDataTable: function() {
        const table = document.createElement("table");

        const stateDescription = `${this.translate("STATE")}:`;
        const stateValue = this.translate(this.currentData.state);
        this.appendTableRow(stateDescription, stateValue, table);

        const socDescription = `${this.translate("CHARGE")}:`
        const socValue = `${this.currentData.soc} %`;
        this.appendTableRow(socDescription, socValue, table);

        const gridPowerDescription = `${this.translate("GRID")}: `;
        const gpValue = this.currentData.gridPower;
        const gridPowerValue = `${this.getWattString(Math.abs(gpValue))} (${gpValue < 0 ? this.translate("CONSUMPTION_FROM_GRID") : this.translate("BACKFEED_TO_GRID")})`;
        this.appendTableRow(gridPowerDescription, gridPowerValue, table);

        const activePowerDescription = `${this.translate("BATTERY")}:`;
        let batteryChargingStateLabel = "";
        const apValue = this.currentData.activePower;
        if(apValue !== 0) {
            batteryChargingStateLabel = ` (${apValue < 0 ? this.translate("BATTERY_DISCHARGE") : this.translate("BATTERY_CHARGE")})`;
        }
        const activePowerValue = `${this.getWattString(Math.abs(apValue))}${batteryChargingStateLabel}`;
        this.appendTableRow(activePowerDescription, activePowerValue, table);

        return table;
    },

    appendTableRow: function(description, value, table) {
        const row = document.createElement("tr");

        const descriptionColumn = document.createElement("td");
        descriptionColumn.textContent = description;
        row.appendChild(descriptionColumn);

        const valueColumn = document.createElement("td");
        valueColumn.textContent = value;
        row.appendChild(valueColumn);

        table.appendChild(row);
    },

    getBatteryDisplay: function() {
        const batteryWrapper = document.createElement("div");
        batteryWrapper.id = "battery-wrapper";
        // Battery should have 90% of module width
        const wrapperWidth = Math.round(this.config.width * 0.9);
        batteryWrapper.style.width = `${wrapperWidth}px`;

        const batteryState = document.createElement("div");
        batteryState.id = "battery-state";

        // Internal display should also narrower than battery to preserve internal border
        // Calculation from right: 8px "battery nose" + 4px border + 5px internal border = 17px
        const maxWidth = wrapperWidth - 18; // Dunno, why 18 seems to look light. 1px got lost somewhere, maybe while rounding
        const factor = this.currentData.soc / 100;
        const width = Math.round(maxWidth * factor);
        batteryState.style.width = `${width}px`;

        // We  will leave this here for debugging
        // Log.info(`Module width: ${this.config.width} | wrapper width: ${wrapperWidth} | width: ${width} | maxWidth: ${maxWidth} | factor: ${factor}`);

        batteryWrapper.appendChild(batteryState);

        return batteryWrapper;
    },

    getWattString: function(value) {
        const kwConversionOptions = this.config.kwConversionOptions;
        if (kwConversionOptions.enabled && (value > kwConversionOptions.threshold)) {
            return `${(value / 1000).toFixed(kwConversionOptions.numDecimalDigits)} kW`;
        }

        return `${value} W`;
    }, 

	getScripts: function() {
		return [];
	},

	getStyles: function () {
		return [
			"MMM-VartaESS.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		return {
			en: "translations/en.json",
			de: "translations/de.json"
		};
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "MMM-VartaESS_INITIALIZED") {
            this.loaded = true;
            this.scheduleUpdate();
		}

        if(notification === "MMM-VartaESS_DATA") {
            this.currentData = payload;
            this.updateDom();
        }
	},
});