"use strict";
/* Magic Mirror
 * Node Helper: MMM-VartaESS
 *
 * By Beh (hello@beh.wtf)
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const VartaFetcher = require("./VartaFetcher").VartaFetcher;

module.exports = NodeHelper.create({
    initialize: async function (config) {
        if (typeof this.fetcher === "undefined") {
            this.fetcher = new VartaFetcher(config);

            this.fetcher.on("DATA", (data) => {
                this.sendSocketNotification("MMM-VartaESS_DATA", data);
            });

            this.fetcher.on("ERROR", (error_string) => {
                this.sendSocketNotification("MMM-VartaESS_ERROR", error_string);
            });

            this.fetcher.run();
            this.sendSocketNotification("MMM-VartaESS_INITIALIZED");
        }
    },

    stop: function () {
        this.fetcher.disconnect();
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "MMM-VartaESS_INIT") {
            this.initialize(payload);
        }
    },
});
