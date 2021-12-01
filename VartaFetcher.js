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

class VartaFetcher {
    constructor(config) {
        this.client = new ModbusRTU();
        this.port = config.port;
        this.ip = config.ip;
        this.clientId = config.clientId;
        this.timeout = 2000;
    }

    async connect() {
        try {
            await this.client.close(() => {
                this.log(`Client ID ${this.clientId}) closed connection.`);
            });
            this.client.setID(this.clientId);
            this.client.setTimeout(this.timeout);
            await this.client.connectTCP(this.ip, { port: this.port });
            this.log(`Connected with client ID: ${this.clientId}).`);
        } catch (error) {
            this.log("Connection error. Trying to reconnect on next fetch.");
            console.log(error);
        }
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

                throw new Error("ERROR_NOT_CONNECTED");
            }

            this.log("Read error.");
            console.log(error)

            throw new Error("ERROR_READ");
        }
    }

    log(msg) {
        console.log(`[Varta Data Fetcher] ${msg}`);
    }
}

module.exports = VartaFetcher;
