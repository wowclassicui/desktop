# WoWClassicUI Desktop App

[https://wowclassicui.com](https://wowclassicui.com)

<img src="docs/app.png" alt="app" height="400">

## Features

* [x] Fetch and Update existing addons
* [x] Display basic addon informations
* [x] Automated addons update (in the background)
* [x] Browse the addons library and allows to install them directly from the App
* [x] Exclude list - for when you don't want to automatically update a specific addon
* [x] Toggle "minimize to system tray" option
* [x] Run the app at system startup (if desired)
* [x] The app updates itself automatically
* [ ] Mac compatibility (including binary serving)

## Development
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn run electron:serve
```

### Compiles and minifies for production
```
yarn run electron:build
```

### Run your tests
```
yarn run test
```

### Lints and fixes files
```
yarn run lint
```

### Deploy
```
yarn run electron:build -p always
```

## TODO

* [ ] Electron's remote module deprecation https://github.com/electron/electron/issues/21408
