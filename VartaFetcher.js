"use strict";
const ModbusRTU = require("modbus-serial");
const Register = require("./Register").Register;
const DataType = require("./Register").DataType;

// Source: https://community.symcon.de/t/modbus-aus-varta-stromspeicher/51144/5
const Registers = {
    NUM_BATTERY_MODULES: new Register(1064, 1, DataType.UINT16),
    STATE: new Register(1065, 1, DataType.UINT16),
    SOC: new Register(1068, 1, DataType.UINT16),
    INSTALLED_CAPACITY: new Register(1071, 1, DataType.UINT16),
    GRID_POWER: new Register(1078, 1, DataType.SINT16),
    ACTIVE_POWER: new Register(1066, 1, DataType.SINT16),
};

const ConnectionState = {
    CONNECTED: "CONNECTED",
    DISCONNECTED: "DISCONNECTED",
}

class VartaFetcher {
    constructor(config, connectionNotificationCallback) {
        this.timeout = 2000;
        this.reconnectInterval = 3000;
        this.connectionNotificationCallback = connectionNotificationCallback;
        this.reconnectInProgress = false;
        this.clientId = config.clientId;

        this.client = new ModbusRTU();
        this.port = config.port;
        this.ip = config.ip;

        this.client.setID(this.clientId);
        this.client.setTimeout(this.timeout);
    }

    async connect() {
        try {

            await this.client.close(() => {
                this.log(`Closed connection.`);
            });

            await this.client.connectTCP(this.ip, { port: this.port });
            this.connectionNotificationCallback(ConnectionState.CONNECTED);
            this.reconnectInProgress = false;

            this.log(`Connected.`);

        } catch (error) {
            this.connectionNotificationCallback(ConnectionState.DISCONNECTED);

            if(!this.reconnectInProgress) {
                this.reconnectInProgress = true;
                this.handleReconnect();
            }

            this.log(`Connection error.`);
            console.log(error);
        }
    }

    handleReconnect() {
        const interval = setInterval(async () => {
            this.log(`Reconnecting in ${this.reconnectInterval}ms`);

            if(this.reconnectInProgress) {
                await this.connect();
            } else {
                clearInterval(interval);
            }

        }, this.reconnectInterval);
    }

    async readRegister(register) {
        const data = (await this.client.readHoldingRegisters(register.address, register.length)).data;
        return register.convertData(data);
    }

    async fetch() {
        try {
            const data = {
                state: await this.readRegister(Registers.STATE),
                soc: await this.readRegister(Registers.SOC),
                gridPower: await this.readRegister(Registers.GRID_POWER),
                activePower: await this.readRegister(Registers.ACTIVE_POWER),
            };

            return data;
        } catch (error) {
            if(!this.client.isOpen) {
                await this.connect();
            }

            throw error;
        }
    }

    log(msg) {
        console.log(`[Varta Data Fetcher (ID: ${this.clientId})] ${msg}`);
    }
}

module.exports = {
    VartaFetcher,
    ConnectionState
}
