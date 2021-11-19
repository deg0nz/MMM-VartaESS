/* global Module */

/* Magic Mirror
 * Module: MMM-VartaESS
 *
 * By Beh (hello@beh.wtf)
 * MIT Licensed.
 */

Module.register("MMM-VartaESS", {
	defaults: {
        ip: "192.168.200.195",
        port: 502,
		updateInterval: 3000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		this.currentData = null;

		//Flag for check if module is loaded
		this.loaded = false;

        this.sendSocketNotification("MMM-VartaESS_INIT", this.config);

        setInterval(function() {
            console.log("Interval")
            if(this.loaded === true) {
                this.fetchData();
            }
        }, this.config.updateInterval);
	},

	// scheduleUpdate: function() {
    //     console.log("schedule triggered")
	// 	setInterval(function() {
	// 		this.fetchData();
	// 	}, this.config.updateInterval);
	// },

	getDom: function() {
        console.log("getDom triggered");
		// create element wrapper for show into the module
		const wrapper = document.createElement("div");
        const table = document.createElement("table");

        const stateRow = document.createElement("tr");
        const stateDescriptionColumn = document.createElement("td");
        stateDescriptionColumn.textContent = "Status:";
        stateRow.appendChild(stateDescriptionColumn);
        const stateValueColumn = document.createElement("td");
        stateValueColumn.textContent = this.currentData.state;
        stateRow.appendChild(stateValueColumn);
        table.appendChild(stateRow);

        const socRow = document.createElement("tr");
        const socDescriptionColumn = document.createElement("td");
        socDescriptionColumn.textContent = "Ladung:";
        socRow.appendChild(socDescriptionColumn);
        const socValueColumn = document.createElement("td");
        socValueColumn.textContent = `${this.currentData.soc} %`;
        socRow.appendChild(socValueColumn);
        table.appendChild(socRow);

        const gridPowerRow = document.createElement("tr");
        const gridPowerDescriptionColumn = document.createElement("td");
        gridPowerDescriptionColumn.textContent = "Stromnetz: ";
        gridPowerRow.appendChild(gridPowerDescriptionColumn);
        const gridPowerValueColumn = document.createElement("td");
        const gpValue = this.currentData.gridPower;
        gridPowerValueColumn.textContent = `${Math.abs(gpValue)} W (${gpValue < 0 ? "Entnahme" : "Einspeisen"})`;
        gridPowerRow.appendChild(gridPowerValueColumn);
        table.appendChild(gridPowerRow);

        const activePowerRow = document.createElement("tr");
        const activePowerDescriptionColumn = document.createElement("td");
        activePowerDescriptionColumn.textContent = "Batterie:";
        activePowerRow.appendChild(activePowerDescriptionColumn);
        const activePowerValueColumn = document.createElement("td");
        const apValue = this.currentData.activePower;
        activePowerValueColumn.textContent = `${Math.abs(apValue)} W (${apValue < 0 ? "Entladen" : "Laden"})`;
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

	fetchData: function() {
        console.log("Fetchdata triggered");
		this.sendSocketNotification("MMM-VartaESS_FETCH_DATA");
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		// if(notification === "MMM-VartaESS_INIT_ACK") {
        //     this.loaded = true;
        //     this.scheduleUpdate();
		// }

        if(notification === "MMM-VartaESS_DATA") {
            if(this.loaded === false) {
                this.loaded = true;
            }

            this.currentData = payload;
            console.log(`Got data in main module: ${JSON.stringify(payload)}`);

            this.updateDom();
        }
	},
});