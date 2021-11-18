/* Magic Mirror
 * Node Helper: MMM-VartaESS
 *
 * By Beh (hello@beh.wtf)
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const VartaFetcher = require("./VartaFetcher").VartaFetcher;
const BatteryState = require("./VartaFetcher").BatteryState;

module.exports = NodeHelper.create({

    init: async function(config) {
        this.fetcher = new VartaFetcher(config);
        await this.fetcher.connect();
        this.sendSocketNotification("MMM-VartaESS_INIT_ACK");
    },

    fetchData: async function() {
        const data = await this.fetcher.fetch();
        const processedData = this.processData(data);
        this.sendSocketNotification("MMM-VartaESS_DATA", processedData);
    },

    processData: function(data) {
        data.state = this.getStateString(data.state)
    },

    getBatteryStateString: function(state) {
        switch (state) {
            case BatteryState.STANDBY:
                return "Standby"
            case BatteryState.CHARGE:
                return "Laden"
            case BatteryState.DISCHARGE:
                return "Entladen"
            case BatteryState.RUN:
                return "ready"
            default:
                return "Unbekannter Status"
        }
    },

	socketNotificationReceived: async function(notification, payload) {
		if (notification === "MMM-VartaESS_INIT") {
            Log.info(JSON.stringify(payload));
            await this.init(payload);
		}

        if(notification === "MMM-VartaESS_FETCH_DATA") {
            await this.fetchData();
        }
	},
});