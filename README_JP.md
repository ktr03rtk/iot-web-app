# iot-web-app

[English](https://github.com/ktr03rtk/iot-web-app/blob/main/README.md)

# 概要

Android OS のスマホと[温湿度センサ Tukeru TH](https://linkingiot.com/devices.html#tukeruTH)を使用して、位置情報（緯度・経度・高度）と温湿度情報をアップロードする Web アプリです。PWA(Progressive Web Apps) として構成しているため、インターネット上でアクセスできるだけでなく、ネイティブアプリのようにアイコンをホーム画面に配置し起動できます。

# 使い方

- start ボタンを押すと位置情報の取得/アップロードと、Bluetooth デバイスのスキャンを開始します。Tukeru Th センサを選択すると温湿度情報の取得とアップロードを開始します。

- stop ボタンを押すと情報取得/アップロードを停止します。

- ホーム画面に起動アイコンを追加できます。アクセス時に"ホーム画面に追加”ダイアログが出たら追加ボタンを押してください。

# インストール方法

- iot-web-app は静的 Web コンテンツです。クラウドサービスなどを利用してホスティングしてください。ホスティング対象ファイルは下記です。

```
iot-web-app
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

- ローカル PC 環境でサーバを立ち上げ、USB デバッグモードで Android スマホから localhost にアクセスして使用することも可能です。

- `js/dataUploader.js`の 14 行目をデータのアップロード先となる任意の URL に書き換えてください。CORS 対応していないため、ホスティング先と共通ドメインにする必要があります。

```
this.apiUrl = <任意のURLを記入してください>
```

- PWA を有効にするため、HTTPS を使用してホスティングしてください。一度ホーム画面にアイコンとして登録されると、ホスティングを終了した後もアプリを使用し続けることができます。(アップロード先の API は有効である必要があります)

- 一度読み込んでキャッシュされたアプリは、ユーザがキャッシュを消さない限り、更新されたコンテンツを読み込むことができません。キャッシュのバージョン管理をすることでコンテンツを自動更新することができます。詳しくはこちらのキャッシュ戦略の[記事](https://web.dev/offline-cookbook/)を参照してください。

# 対応 OS

動作確認しているのは Android OS の Chrome のみです。

# 参考

温湿度センサとの通信、物理値変換には[futomi/node-linking](https://github.com/futomi/node-linking)のライブラリを参考にさせていただきました。
