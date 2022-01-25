"use strict";
const EventEmitter = require('events');
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

const State = {
    INIT: 0,
    IDLE: 1,
    NEXT: 2,
    READ_SUCCESS: 3,
    READ_FAIL: 4,
    CONNECT_SUCCESS: 5,
    CONNECT_FAIL: 6
}

class VartaFetcher extends EventEmitter {
    constructor(config) {
        super();
        this.timeout = 1000;
        this.updateInterval = config.updateInterval;
        this.clientId = config.clientId;
        this.port = config.port;
        this.ip = config.ip;

        this.client = new ModbusRTU();
        this.client.setID(this.clientId);
        this.client.setTimeout(this.timeout);


        this.state = State.INIT;
    }

    async connect() {
        try {
            await this.client.close(() => {
                console.log("VartaFetcher connection closed.");
            });

            await this.client.connectTCP(this.ip, { port: this.port });
            
            this.state = State.CONNECT_SUCCESS;

            this.log(`Connected.`);
        } catch (error) {
            this.state = State.CONNECT_FAIL;

            this.log(`Connection error.`);
            console.log(error);
        }
    }

    async readRegister(register) {
        const data = (await this.client.readHoldingRegisters(register.address, register.length)).data;
        return register.convertData(data);
    }

    async readData() {
        try {
            const data = {
                state: await this.readRegister(Registers.STATE),
                soc: await this.readRegister(Registers.SOC),
                gridPower: await this.readRegister(Registers.GRID_POWER),
                activePower: await this.readRegister(Registers.ACTIVE_POWER),
            };

            this.emit("DATA", data);
            this.state = State.READ_SUCCESS;

            this.log("Successfully read modbus data.");

        } catch (error) {
            this.emit("READ_ERROR", error);
            this.state = State.READ_FAIL;

            this.log("Modbus read error");
            this.log(JSON.stringify(error));
        }
    }

    async run() {
        // let nextAction;

        switch (this.state) {
            case State.INIT:
                await this.connect();
                break;
    
            case State.NEXT:
                await this.readData();
                break;
    
            case State.CONNECT_SUCCESS:
                await this.readData();
                break;
    
            case State.CONNECT_FAIL:
                await this.connect();
                break;
    
            case State.READ_SUCCESS:
                await this.readData();
                break;
    
            case State.READ_FAIL:
                if (this.client.isOpen)  { 
                    this.state = State.NEXT;  
                } else { 
                    await this.connect(); 
                }
                break;
    
            default:
                // nothing to do, keep scanning until actionable case
        }

        setTimeout(() => {
            this.run();
        }, this.updateInterval);
    }

    log(msg) {
        console.log(`[Varta Data Fetcher (ID: ${this.clientId})] ${msg}`);
    }
}

module.exports = {
    VartaFetcher
}
