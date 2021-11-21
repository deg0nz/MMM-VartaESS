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
    try {
      const data = {
        state: await this.readRegister(Registers.STATE),
        soc: await this.readRegister(Registers.SOC),
        gridPower: await this.readRegister(Registers.GRID_POWER),
        activePower: await this.readRegister(Registers.ACTIVE_POWER),
      };

      return data;
    } catch (error) {
      await this.handleError(error);
    }
  }

  async handleError(error) {
    if (error.message === "Port Not Open") {
        this.client = this.client = new ModbusRTU();
      const reconnectTimeout = 1500;
      console.log(`Fetching data from Varta Energy Storage failed. Trying to reconnect in ${reconnectTimeout}ms`);
      setTimeout(async () => {
        await this.connect();
      }, reconnectTimeout);
    } else {
      throw error;
    }
  }
}

module.exports = VartaFetcher;
