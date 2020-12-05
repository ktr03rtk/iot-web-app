if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('service-worker.js')
      .then((reg) => {
        console.log('Service worker registered!', reg);
        return;
      })
      .then(() => {
        if (navigator.serviceWorker.controller) {
          return startLogger();
        }
        return controllerChange;
      })
      .catch((err) => {
        console.log('Service worker registration failed: ', err);
      });
  });
}

let controllerChange = new Promise((resolve, reject) => {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    resolve(startLogger());
  });
});

function startLogger() {
  const status = document.getElementById('status');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');

  startBtn.addEventListener('click', () => {
    window.geolocationSensor.start();
    window.tempHumiditySensor.start();
    window.dataUploader.start();
    window.screenWakeLock.lock();
    startBtn.setAttribute('disabled', true);
    stopBtn.removeAttribute('disabled');
    status.innerText = 'GPS・温湿度情報収集中';
  });

  stopBtn.addEventListener('click', () => {
    window.geolocationSensor.stop();
    window.tempHumiditySensor.stop();
    window.dataUploader.stop();
    window.screenWakeLock.unlock();
    startBtn.removeAttribute('disabled');
    stopBtn.setAttribute('disabled', true);
    status.innerText = 'GPS・温湿度情報収集停止中';
  });
}

window.mainjs = {
  latitude: null,
  longitude: null,
  altitude: null,
  temperature: null,
  humidity: null,
};
