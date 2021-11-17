const ModbusRTU = require("modbus-serial");
const Registers = require("./Register");

const Registers = {
    NUM_BATTERY_MODULES: new Register(1064, 1),
    STATE: new Register(1065, 1),
    SOC: new Register(1068, 1),
    INSTALLED_CAPACITY: new Register(1071, 1),
    GRID_POWER: new Register(1078, 1),
}

class VartaFetcher {
    constructor(config) {
        this.client = new ModbusRTU();
        this.port = config.port;
        this.ip = config.ip;
    }

    connect() {
        this.client.connectTCP(this.ip, { port: this.port });
        this.client.setID(1);
    }

    async readRegister(register) {
        const data = (await this.client.readHoldingRegisters(register.address, register.length)).data
        return data[0]
    }
}