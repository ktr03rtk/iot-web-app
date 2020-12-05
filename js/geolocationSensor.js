(function () {
  'use strict';
  class GeolocationSensor {
    constructor() {
      this.geolocationLog = [];
      this.sendGpsLogInterval = null;
      this.watchId = null;
    }

    start() {
      if (typeof navigator.geolocation === 'undefined') {
        return;
      }

      const wOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
      };

      this.watchId = navigator.geolocation.watchPosition(
        this._success.bind(this),
        this._handleError.bind(this),
        wOptions
      );
    }

    stop() {
      navigator.geolocation.clearWatch(this.watchId);
      clearInterval(this.collectGpsLogInterval);
      clearInterval(this.sendGpsLogInterval);
    }

    // utils

    _success(pos) {
      window.mainjs.latitude = pos.coords.latitude.toFixed(6);
      window.mainjs.longitude = pos.coords.longitude.toFixed(6);
      if (pos.coords.altitude !== null) {
        window.mainjs.altitude = pos.coords.altitude.toFixed(6);
      }
    }

    _handleError(error) {
      console.log(error);
    }
  }

  window.geolocationSensor = new GeolocationSensor();
})();
