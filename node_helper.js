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
        await this.fetchData();
        console.log("Fetcher init");
    },

    fetchData: async function() {
        const data = await this.fetcher.fetch();
        
        console.log(`Got data in helper: ${JSON.stringify(data)}`);

        const processedData = this.processData(data);
        this.sendSocketNotification("MMM-VartaESS_DATA", processedData);
    },

    processData: function(data) {
        data.state = this.getBatteryStateString(data.state)
        return data;
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
            console.log(JSON.stringify(payload));
            await this.init(payload);
		}

        if(notification === "MMM-VartaESS_FETCH_DATA") {
            this.fetchData();
        }
	},
});