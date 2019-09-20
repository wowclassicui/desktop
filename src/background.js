/* global __static */
'use strict'

import { app, protocol, BrowserWindow, Tray, Menu, ipcMain } from 'electron'
import path from 'path'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
const Store = require('electron-store')
const electronStore = new Store()
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let tray

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { secure: true, standard: true }
}])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 900,
    height: 600,
    // resizable: false,
    icon: path.join(__static, 'icon.png'),
    webPreferences: {
      nodeIntegration: true
    }
  })
  // Hides menu bar (press ALT to show)
  win.setAutoHideMenuBar(true)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('close', (event) => {
    if (electronStore.get('minimizeToTray', true)) {
      event.preventDefault()
      win.hide()
    }
  })

  win.on('closed', () => {
    win = null
  })
}

function createTray () {
  tray = new Tray(path.join(__static, 'icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        win.show()
      }
    },
    {
      label: 'Quit',
      click: () => {
        win.destroy()
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
  tray.setToolTip('Classic Warcraft App')
  tray.on('click', () => {
    toggleWindow()
  })
}

const toggleWindow = function () {
  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
  }
}

const gotTheLock = app.requestSingleInstanceLock()

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

if (!gotTheLock && !isDevelopment) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) {
        win.restore()
      }
      if (!win.isVisible()) {
        win.show()
      }
      win.focus()
    }
  })

  app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      // Devtools extensions are broken in Electron 6.0.0 and greater
      // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
      // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
      // If you are not using Windows 10 dark mode, you may uncomment these lines
      // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
      // try {
      //   await installVueDevtools()
      // } catch (e) {
      //   console.error('Vue Devtools failed to install:', e.toString())
      // }
    }

    createTray()
    createWindow()
  })
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// Events & addons update
let init = false
let lookForUpdates = true
let checkInterval = 3600
let timer = null

ipcMain.on('initLookForUpdates', function (evt, args) {
  if (init) {
    return
  }

  init = true
  lookForUpdates = args.lookForUpdates
  checkInterval = args.checkInterval

  if (lookForUpdates) {
    // Doing this for safety. Shouldn't be required.
    if (timer !== null) {
      clearInterval(timer)
    }

    timer = setInterval(askForUpdate, checkInterval * 1000)
  }
})

ipcMain.on('checkIntervalUpdate', function (evt, args) {
  if (checkInterval === args.checkInterval && args.lookForUpdates) {
    // There is no need to clear and update interval
    return
  }

  lookForUpdates = args.lookForUpdates
  checkInterval = args.checkInterval

  if (timer !== null) {
    clearInterval(timer)
  }

  if (lookForUpdates) {
    timer = setInterval(askForUpdate, checkInterval * 1000)
  }
})

const askForUpdate = () => {
  if (win === null) {
    return
  }

  // Avoid to send "askForUpdate" when app isn't minimized (to tray)
  if (win.isVisible()) {
    return
  }

  win.webContents.send('askForUpdate')
}
