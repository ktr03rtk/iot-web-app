(function () {
  'use strict';
  class TempHumiditySensor {
    constructor() {
      this.device = null;
      this.deviceNamePrefix = 'Tukeru_th';
      this.primaryServiceUuid = 'b3b36901-50d3-4044-808d-50835b13a6cd';
      this.writeCharacteristicUuid = 'b3b39101-50d3-4044-808d-50835b13a6cd';
      this.indicateCharacteristicUuid = 'b3b39102-50d3-4044-808d-50835b13a6cd';
      this.writeBuffTemperature = new Uint8Array(
        Array.from('332022100431001').map((x) => Number(x))
      );
      this.writeBuffHumidity = new Uint8Array(
        Array.from('332022100531001').map((x) => Number(x))
      );
      this._characteristics = new Map();
      this.mapData = new Map();
      this._div_packet_queue = [];
    }

    start() {
      return navigator.bluetooth
        .requestDevice({
          acceptAllDevices: false,
          filters: [{ namePrefix: this.deviceNamePrefix }],
          optionalServices: [this.primaryServiceUuid],
        })
        .then((device) => {
          this.device = device;
          return device.gatt.connect();
        })
        .then((server) => {
          console.log('BLE connected');
          return Promise.all([
            this._getServiceAndCacheCharacteristic(
              server,
              this.primaryServiceUuid,
              this.writeCharacteristicUuid
            ),
            this._getServiceAndCacheCharacteristic(
              server,
              this.primaryServiceUuid,
              this.indicateCharacteristicUuid
            ),
          ]);
        })
        .then(() => {
          setTimeout(() => {
            this._readAndWriteCharacteristicValue();
          }, 10000);
          return;
        })
        .catch((err) => {
          console.log(err);
        });
    }

    stop() {
      if (!this.device || !this.device.gatt.connected) return;
      this.device.gatt.disconnect();
      console.log('BLE disconnected');
    }

    // utils

    _getServiceAndCacheCharacteristic(server, serviceUuid, characteristicUuid) {
      server.getPrimaryService(serviceUuid).then((service) => {
        return this._cacheCharacteristic(service, characteristicUuid);
      });
    }

    _cacheCharacteristic(service, characteristicUuid) {
      return service
        .getCharacteristic(characteristicUuid)
        .then((characteristic) => {
          this._characteristics.set(characteristicUuid, characteristic);
          return;
        });
    }

    _readAndWriteCharacteristicValue() {
      let writeCharacteristic = this._characteristics.get(
        this.writeCharacteristicUuid
      );
      let indicateCharacteristic = this._characteristics.get(
        this.indicateCharacteristicUuid
      );
      return Promise.all([
        this._getValue(this.indicateCharacteristicUuid, indicateCharacteristic),
        this._writeValue(this.writeCharacteristicUuid, writeCharacteristic),
      ]).then(() => {
        return;
      });
    }

    _writeValue(uuid, characteristic) {
      setTimeout(() => {
        characteristic.writeValue(this.writeBuffHumidity);
      }, 1000);
      setTimeout(() => {
        characteristic.writeValue(this.writeBuffTemperature);
      }, 5000);

      return;
    }

    _getValue(uuid, characteristic) {
      const handler = (event) => {
        const recv_value = event.target.value.buffer;
        this._receivedPacket(recv_value);
        return;
      };

      characteristic.addEventListener('characteristicvaluechanged', handler);

      characteristic.startNotifications().catch((error) => {
        console.error(error);
      });

      return;
    }

    _receivedPacket(buf) {
      let new_buf = new Uint8Array(buf.slice(1));
      this._div_packet_queue.push(new_buf);
      if (this._isExecutedPacket(buf)) {
        let header_byte = new Uint8Array(buf.slice(0, 1));
        let length = 0;

        this._div_packet_queue.forEach((buf_array) => {
          length += buf_array.byteLength;
        });
        let total_buf = new Uint8Array(new ArrayBuffer(length + 1));
        total_buf.set(header_byte, 0);
        let i = 1;
        this._div_packet_queue.forEach((buf_array) => {
          total_buf.set(buf_array, i);
          i += buf_array.byteLength;
        });

        this._receivedIndicate(total_buf);
        this._div_packet_queue = [];
      }
    }

    _isExecutedPacket(buf) {
      let ph = new Uint8Array(buf)[0];
      return ph & 0x00000001 ? true : false;
    }

    _receivedIndicate(buf) {
      let parsed = this._parseResponse(buf);
      if (parsed['serviceId'] === 3) {
        if (parsed['messageId'] === 4) {
          let sensor_type = -1;
          parsed['parameters'].forEach((p) => {
            let pid = p['parameterId'];
            if (pid === 2) {
              // SensorType
              sensor_type = p['sensorTypeCode'];
            } else {
              if (sensor_type === 4) {
                window.mainjs.temperature = String(p['temperature']);
                return;
              } else if (sensor_type === 5) {
                window.mainjs.humidity = String(p['humidity']);
                return;
              }
            }
          });

          return;
        }
      }
    }

    _parseResponse(buf) {
      let dataview = new DataView(buf.buffer);
      let service_id = dataview.getUint8(1);
      let msg_id = dataview.getUint16(2, true);
      let pnum = dataview.getUint8(4);
      let payload_buf = buf.slice(5, buf.length);
      let parameters = this._parsePayload(pnum, payload_buf);

      let parsed = {
        buffer: buf,
        serviceId: service_id,
        messageId: msg_id,
        parameters: parameters,
      };
      return parsed;
    }

    _parsePayload(pnum, buf) {
      let dataview = new DataView(buf.buffer);
      let offset = 0;
      let parameters = [];
      let sensor_type = 0;

      try {
        for (let i = 0; i < pnum; i++) {
          let pid = dataview.getUint8(offset++);
          let plen_buf_part = buf.slice(offset, offset + 3);
          let plen_buf = new Uint8Array(
            new ArrayBuffer(plen_buf_part.byteLength + 1)
          );
          plen_buf.set(plen_buf_part, 0);
          plen_buf.set(new Uint8Array(1), plen_buf_part.byteLength);
          let plen_dataview = new DataView(plen_buf.buffer);
          let plen = plen_dataview.getUint32(0, true);
          offset += 3;
          let pvalue_buf = buf.slice(offset, offset + plen);
          offset += plen;
          let p = this._parseParameter(pid, pvalue_buf, sensor_type);
          if (pid === 0x02 && 'sensorTypeCode' in p) {
            sensor_type = p['sensorTypeCode'];
          }
          parameters.push(p);
        }
      } catch (e) {
        console.log(e);
      }
      return parameters;
    }

    _parseParameter(pid, buf, sensor_type) {
      let parsed = {};
      if (pid === 0x02) {
        parsed = this._parseSensorType(buf);
      } else if (pid === 0x0a) {
        parsed = this._parseOriginalData(buf, sensor_type);
      }
      parsed['parameterId'] = pid;
      return parsed;
    }

    _parseSensorType(buf) {
      let dataview = new DataView(buf.buffer);
      let code = dataview.getUint8(0);
      let text = '';
      if (code === 0x04) {
        text = 'Temperature';
      } else if (code === 0x05) {
        text = 'Humidity';
      }
      return {
        name: 'SensorType',
        sensorTypeCode: code,
        sensorTypeText: text,
      };
    }

    _parseOriginalData(buf, sensor_type) {
      let dataview = new DataView(buf.buffer);
      let n = dataview.getUint16(0, true) & 0b0000111111111111;
      if (sensor_type === 0x04) {
        // Temperature
        return {
          temperature: this._read(n, 1, 4, 7),
        };
      } else if (sensor_type === 0x05) {
        // Humidity
        let v = this._read(n, 0, 4, 8);
        return {
          humidity: v,
        };
      } else {
        return {};
      }
    }

    _read(n, slen, elen, flen) {
      let sgn = slen ? (n >>> 11) & 0b1 : 0; // sign
      let max = Math.pow(2, elen) - 1; // maximum of exponent
      let exp = (n >>> flen) & max; // exponent
      let fra = 0; // fraction
      for (let i = 0; i < flen; i++) {
        if ((n >>> (flen - i - 1)) & 0b1) {
          fra += Math.pow(2, -(i + 1));
        }
      }
      if (exp === 0 && fra === 0) {
        return 0;
      } else if (exp === 0 && fra !== 0) {
        let m = Math.pow(2, elen - 1) - 1; // median (7 or 15)
        let v = Math.pow(-1, sgn) * fra * Math.pow(2, 1 - m);
        return v;
      } else if (exp >= 1 && exp <= max - 1) {
        let m = Math.pow(2, elen - 1) - 1; // median (7 or 15)
        let v = Math.pow(-1, sgn) * (1 + fra) * Math.pow(2, exp - m);
        return v;
      } else if (exp === max && fra === 0) {
        return Infinity;
      } else {
        return NaN;
      }
    }
  }

  window.tempHumiditySensor = new TempHumiditySensor();
})();
