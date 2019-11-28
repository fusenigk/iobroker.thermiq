"use strict";

/*
 * Created with @iobroker/create-adapter v1.18.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const request = require('request');

// Load your modules here, e.g.:
// const fs = require("fs");

class Thermiq extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "thermiq",
		});

		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("thermiq ip: " + this.config.thermiqip);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		// await this.setObjectAsync("testVariable", {
		// 	type: "state",
		// 	common: {
		// 		name: "testVariable",
		// 		type: "boolean",
		// 		role: "indicator",
		// 		read: true,
		// 		write: true,
		// 	},
		// 	native: {},
		// });

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");

		request(
                    {
                        url: 'http://' + this.config.thermiqip + '/jquery_server.php?db_query=select+HP_THERMIA_REGS.REGNAME%2CHP_THERMIA_REGS.REGNUM%2CTIME%2CREGVALUE+from+HP_THERMIA_REGS%2CHP_POLLDATA+where+(HP_THERMIA_REGS.regnum%3DHP_POLLDATA.regnum)&db_name=thermiq_db',
                        json: true,
                        time: true,
                        timeout: 4500
                    },
                    
                    (error, response, content) => {
                        //this.log.info('local http request done');

                        if (response) {
                        	const self = this;
                        	//this.log.info('received data (' + response.statusCode + '): ' +  JSON.stringify(content));

                        	if (content && Array.isArray(content) ) {
                        		this.log.info('content is array') ;
                        	
                        		  const sensorData = content[0];
 								  //this.log.info('array2: ' + content.length);
                        		  //this.log.info('received data:' + sensorData );

								  content.forEach(function (arrayItem) {
    							     //self.log.info(arrayItem.REGNAME + ': ' + arrayItem.REGVALUE) ;
    							     
    							        self.setObjectNotExists(arrayItem.REGNAME, {
					                                            type: 'state',
					                                            common: {
					                                                name: arrayItem.REGNAME,
					                                                type: 'number',
					                                                role: 'value',
					                                                unit: '',
					                                                read: true,
					                                                write: false
					                                            },
					                                            native: {}
					                                        });

					        			self.setState(arrayItem.REGNAME, {val: parseInt(arrayItem.REGVALUE), ack: true});
								  });

                        	}

 						} else if (error) {
                            this.log.info(error);
                        }
                    }
                );

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");
		
		setTimeout(this.stop.bind(this), 10000);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Thermiq(options);
} else {
	// otherwise start the instance directly
	new Thermiq();
}