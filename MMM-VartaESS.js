Module.register("MMM-VartaESS",{
	// Default module config.
	defaults: {
        ip: "192.168.200.195",
        port: 502,
		text: "Hello World!"
	},
    start: function() {
        Log.info(`${this.name} started.`)
    },
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.innerHTML = this.config.text;
		return wrapper;
	}
});