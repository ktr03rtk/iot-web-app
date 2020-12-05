(function () {
  'use strict';
  class DataUploader {
    constructor() {
      this.environmentLog = [];
      this.collectEnvironmentLogInterval = null;
      this.sendEnvironmentLogInterval = null;
      this.latitude = document.getElementById('latitude');
      this.longitude = document.getElementById('longitude');
      this.altitude = document.getElementById('altitude');
      this.temperature = document.getElementById('temperature');
      this.humidity = document.getElementById('humidity');
      this.status = document.getElementById('response-status');
    }

    start() {
      this.collectEnvironmentLogInterval = setInterval(() => {
        this._collectEnvironmentLog();
        this._displayCurrentEnvironmentLog();
        // }, 1000);
      }, 5000);

      this.sendEnvironmentLogInterval = setInterval(() => {
        this._sendEnvironmentLog();
        // }, 5000);
      }, 6000);
    }

    stop() {
      clearInterval(this.collectEnvironmentLogInterval);
      clearInterval(this.sendEnvironmentLogInterval);
    }

    // utils

    _collectEnvironmentLog() {
      this.environmentLog.push([
        new Date().toISOString(),
        window.mainjs.latitude,
        window.mainjs.longitude,
        window.mainjs.altitude,
        window.mainjs.temperature,
        window.mainjs.humidity,
      ]);
    }

    _displayCurrentEnvironmentLog() {
      if (window.mainjs.latitude !== null && window.mainjs.longitude !== null) {
        this.latitude.innerText = this._addUnit(window.mainjs.latitude);
        this.longitude.innerText = this._addUnit(window.mainjs.longitude);
      }
      if (window.mainjs.altitude !== null) {
        this.altitude.innerText = window.mainjs.altitude + 'm';
      }
      if (window.mainjs.temperature !== null) {
        this.temperature.innerText = window.mainjs.temperature + '°C';
      }
      if (window.mainjs.humidity !== null) {
        this.humidity.innerText = window.mainjs.humidity + '％';
      }
    }

    _addUnit(locationStr) {
      let position;
      let direction;
      const str = locationStr.split('.');

      if (str[0] !== '-') {
        if (str[0].length === 2) {
          direction = 'N';
        } else {
          direction = 'E';
        }
      } else {
        if (str[0].length === 3) {
          direction = 'S';
        } else {
          direction = 'W';
        }
      }

      // 35°38'52.8"N 139°35'53.8"E
      position =
        str[0] +
        '°' +
        str[1].substr(0, 2) +
        "'" +
        str[1].substr(2, 2) +
        '.' +
        str[1].substr(4) +
        '"' +
        direction;

      return position;
    }

    _sendEnvironmentLog() {
      // 送信完了したログだけ確実に削除するため、送信ログ数を管理
      const arrayLength = this.environmentLog.length;
      const data = {
        environmentLog: this.environmentLog.slice(0, arrayLength),
      };

      fetch(location.protocol + '//' + location.host + '/api/gps-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (!res.ok) {
            console.error('error response', res);
            throw new Error('response error');
          } else {
            return res.json();
          }
        })
        .then((response) => {
          if (response.status !== 'accepted') {
            console.error('error response', response);
            throw new Error('response status error');
          } else {
            // console.log(response);
            this.status.innerText = response.status;
            this.environmentLog.splice(0, arrayLength);
          }
        })
        .catch((error) => {
          console.log(error);
          this.status.innerText = 'error';
        });
    }
  }

  window.dataUploader = new DataUploader();
})();
