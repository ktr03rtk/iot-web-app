# iot-web-app

[日本語](https://github.com/ktr03rtk/iot-web-app/blob/main/README_JP.md)

# Overview

This is a web application that uses an Android OS phone and [Tukeru TH temperature and humidity sensor] (https://linkingiot.com/devices.html#tukeruTH) to upload location information (latitude, longitude, and altitude) and temperature and humidity information. Composed as PWA ( Progressive Web Apps), you can place app icons on the home screen just like native apps.

# Demo

![demo](https://raw.github.com/wiki/ktr03rtk/iot-web-app/demo.gif)

# Usage

- Press the Start button, and select scanned Bluetooth device. Then you can collect and upload location, temperature and humidity information.

- Press the Stop button to stop collecting and uploading information.

- You can place the activation icon to the home screen. When the "Add to Home Screen" dialog appears, click the button.

# How to install

- iot-web-app is a static web contents. Please use a suitable cloud service to host it. The files to be hosted are as follows.

```
src
├── images
│   └── icons
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       ├── icon-512x512.png
│       ├── icon-72x72.png
│       └── icon-96x96.png
├── index.html
├── js
│   ├── dataUploader.js
│   ├── geolocationSensor.js
│   ├── screenWakeLock.js
│   └── tempHumiditySensor.js
├── main.js
├── manifest.json
├── service-worker.js
└── styles
    └── main.css
```

- It is also possible to set up a server on the local PC environment and use USB debug mode phone to access the localhost from an Android phone.

- Replace line 14 of `src/js/dataUploader.js` with a target URL of uploading. CORS support is required when sending a request to a different domain than the host.

```
this.apiUrl = <place the target URL>
```

- To enable PWA, host your app using HTTPS.

- Once your app is registered as pwa on the phone, you can continue to use it even after you stop hosting. (The API URL you are uploading to must be enabled.)

- Once loaded and cached, the app will not be able to load the updated content unless the user clears the cache. You can update content automatically by versioning the cache. For more information, see this cache strategy [article] (https://web.dev/offline-cookbook/).

# Supported OS

Only tested on Chrome on Android OS.

# Reference

For communication with the temperature/humidity sensor and physical value conversion, we used the [futomi/node-linking](https://github.com/futomi/node-linking) library as a reference.
