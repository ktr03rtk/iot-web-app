(function () {
  'use strict';
  class ScreenWakeLock {
    constructor() {
      this.wakeLock = null;

      //  Restart screen wake lock when returning to the app.
      document.addEventListener(
        'visibilitychange',
        this._handleVisibilityChange.bind(this)
      );
    }

    async lock() {
      if ('wakeLock' in navigator && this.wakeLock === null) {
        // Function that attempts to request a screen wake lock.
        await this._requestWakeLock();
      }
    }

    async unlock() {
      if (this.wakeLock !== null && document.visibilityState === 'visible') {
        await this.wakeLock.release();
        this.wakeLock.removeEventListener('release', () => {
          console.log('Screen Wake Lock released!');
        });
        this.wakeLock = null;
      }
    }

    // utils

    async _requestWakeLock() {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          console.log('Screen Wake Lock released!');
        });
        console.log('Screen Wake Locked!');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }

    async _handleVisibilityChange() {
      if (this.wakeLock !== null && document.visibilityState === 'visible') {
        console.log('Screen Wake Locked again!');
        await this._requestWakeLock();
      }
    }
  }

  window.screenWakeLock = new ScreenWakeLock();
})();
