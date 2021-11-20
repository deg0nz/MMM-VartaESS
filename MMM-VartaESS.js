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
		updateInterval: 3000
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

        if(this.currentData === null && !this.loaded) {
            wrapper.innerHTML = `${this.translate("LOADING")}...`;
            wrapper.className = "small light dimmed";
            return wrapper;
        }
            
        const batteryWrapper = document.createElement("div");
        batteryWrapper.id = "battery-wrapper";

        // Table for displaying Values
        const table = document.createElement("table");

        const stateRow = document.createElement("tr");
        const stateDescriptionColumn = document.createElement("td");
        stateDescriptionColumn.textContent = `${this.translate("STATE")}:`;
        stateRow.appendChild(stateDescriptionColumn);
        const stateValueColumn = document.createElement("td");
        stateValueColumn.textContent = this.translate(this.currentData.state);
        stateRow.appendChild(stateValueColumn);
        table.appendChild(stateRow);

        const socRow = document.createElement("tr");
        const socDescriptionColumn = document.createElement("td");
        socDescriptionColumn.textContent = `${this.translate("CHARGE")}:`;
        socRow.appendChild(socDescriptionColumn);
        const socValueColumn = document.createElement("td");
        socValueColumn.textContent = `${this.currentData.soc} %`;
        socRow.appendChild(socValueColumn);
        table.appendChild(socRow);

        const gridPowerRow = document.createElement("tr");
        const gridPowerDescriptionColumn = document.createElement("td");
        gridPowerDescriptionColumn.textContent = `${this.translate("GRID")}: `;
        gridPowerRow.appendChild(gridPowerDescriptionColumn);
        const gridPowerValueColumn = document.createElement("td");
        const gpValue = this.currentData.gridPower;
        gridPowerValueColumn.textContent = `${Math.abs(gpValue)} W (${gpValue < 0 ? this.translate("CONSUMPTION_FROM_GRID") : this.translate("BACKFEED_TO_GRID")})`;
        gridPowerRow.appendChild(gridPowerValueColumn);
        table.appendChild(gridPowerRow);

        const activePowerRow = document.createElement("tr");
        const activePowerDescriptionColumn = document.createElement("td");
        activePowerDescriptionColumn.textContent = `${this.translate("BATTERY")}:`;
        activePowerRow.appendChild(activePowerDescriptionColumn);
        const activePowerValueColumn = document.createElement("td");
        const apValue = this.currentData.activePower;
        let batteryChargingStateLabel = "";
        if(apValue !== 0) {
            batteryChargingStateLabel = ` (${apValue < 0 ? this.translate("BATTERY_DISCHARGE") : this.translate("BATTERY_CHARGE")})`;
        }
        activePowerValueColumn.textContent = `${Math.abs(apValue)} W${batteryChargingStateLabel}`;
        activePowerRow.appendChild(activePowerValueColumn);
        table.appendChild(activePowerRow);

        wrapper.appendChild(table);
		return wrapper;
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