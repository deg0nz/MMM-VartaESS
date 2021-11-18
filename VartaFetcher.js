const ModbusRTU = require("modbus-serial");
const Register = require("./Register").Register;
const DataType = require("./Register").DataType;

const Registers = {
    NUM_BATTERY_MODULES: new Register(1064, 1, DataType.UINT16),
    STATE: new Register(1065, 1, DataType.UINT16),
    SOC: new Register(1068, 1, DataType.UINT16),
    INSTALLED_CAPACITY: new Register(1071, 1, DataType.UINT16),
    GRID_POWER: new Register(1078, 1, DataType.SINT16),
    ACTIVE_POWER: new Register(1066, 1, DataType.SINT16)
}

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

class VartaFetcher {
    constructor(config) {
        this.client = new ModbusRTU();
        this.port = config.port;
        this.ip = config.ip;
    }

    async connect() {
        await this.client.connectTCP(this.ip, { port: this.port });
        this.client.setID(1);
    }

    async readRegister(register) {
        const data = (await this.client.readHoldingRegisters(register.address, register.length)).data;
        return register.convertData(data);
    }

    async fetch() {
        const data = {
            state: await this.readRegister(Registers.STATE),
            soc: await this.readRegister(Registers.SOC),
            gridPower: await this.readRegister(Registers.GRID_POWER),
            activePower: await this.readRegister(Registers.ACTIVE_POWER)
        };

        return data;
    }
}

module.exports = {
    BatteryState,
    VartaFetcher
}