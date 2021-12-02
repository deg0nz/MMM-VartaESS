"use strict";
/* Magic Mirror
 * Node Helper: MMM-VartaESS
 *
 * By Beh (hello@beh.wtf)
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const VartaFetcher = require("./VartaFetcher").VartaFetcher;
const ConnectionState = require("./VartaFetcher").ConnectionState;

const BatteryState = {
    BUSY: 0,    // e.g. Booting
    RUN: 1,     // ready to charge/discharge
    CHARGE: 2,
    DISCHARGE: 3,
    STANDBY: 4,
    ERROR: 5,
    PASSIVE: 6, // Service
    ISLANDING: 7
}

module.exports = NodeHelper.create({
    initialize: async function(config) {
        const fetcherConnectionNotificationCallback = (state) => {
            if(state === ConnectionState.CONNECTED)
                this.sendSocketNotification("MMM-VartaESS_FETCHER_CONNECTED");
    
            if(state === ConnectionState.DISCONNECTED)
                this.sendSocketNotification("MMM-VartaESS_FETCHER_DISCONNECTED");
        };

        this.fetcher = new VartaFetcher(config, fetcherConnectionNotificationCallback);
        await this.fetcher.connect();
        this.sendSocketNotification("MMM-VartaESS_INITIALIZED");
    },

    fetchData: async function() {
        if(typeof this.fetcher === "undefined")
            return;

        try {
            const data = await this.fetcher.fetch();
            const processedData = this.processData(data);
            this.sendSocketNotification("MMM-VartaESS_DATA", processedData);        
        } catch (error) {
            console.log(error);
        }
    },

    processData: function(data) {
        data.state = this.getBatteryStateString(data.state)
        return data;
    },

    getBatteryStateString: function(state) {
        switch (state) {
            case BatteryState.BUSY:
                return "BATTERY_BUSY";
            case BatteryState.RUN:
                return "BATTERY_RUN";
            case BatteryState.CHARGE:
                return "BATTERY_CHARGE";
            case BatteryState.DISCHARGE:
                return "BATTERY_DISCHARGE";
            case BatteryState.STANDBY:
                return "BATTERY_STANDBY";
            case BatteryState.ERROR:
                return "BATTERY_ERROR";
            case BatteryState.PASSIVE:
                return "BATTERY_PASSIVE";
            case BatteryState.ISLANDING:
                return "BATTERY_ISLANDING";
            default:
                return "BATTERY_UNKOWN";
        }
    },

	socketNotificationReceived: function(notification, payload) {
		if (notification === "MMM-VartaESS_INIT") {
            this.initialize(payload);
		}

        if(notification === "MMM-VartaESS_FETCH_DATA") {
            this.fetchData();
        }
	},
});