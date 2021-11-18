const DataType = {
    UINT16: "uint16",
    SINT16: "sint16"
}

class Register {
    constructor(address, length, dataType){
        this.address = address;
        this.length = length;
        this.dataType = dataType;
    }

    convertData(rawData) {
        let output;
        switch (this.dataType) {
            case DataType.UINT16:
                output = Uint16Array.from(gpBuf);
                break;

            case DataType.SINT16:
                output = Int16Array.from(rawData);
                break;
        }

        // Currently, all values have 16 Bit, so we can safely return this
        return output[0];
    }
}

module.exports = {
    Register,
    DataType
}