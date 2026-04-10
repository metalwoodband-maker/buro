const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");

let mainWindow;
let watcher;
const settingsPath = path.join(app.getPath("userData"), "settings.json");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
  const settings = loadSettings();
  if (settings.folder) startWatching(settings.folder);
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.on("save-settings", (event, data) => {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
  if (data.folder) startWatching(data.folder);
});

function loadSettings() {
  if (fs.existsSync(settingsPath)) {
    return JSON.parse(fs.readFileSync(settingsPath));
  }
  return {};
}

function startWatching(folderPath) {
  if (watcher) watcher.close();

  watcher = chokidar.watch(folderPath, {
    ignored: /^\./,
    persistent: true
  });

  watcher.on("add", (filePath) => {
    console.log("Neue Datei:", filePath);
    processDocument(filePath);
  });
}

function processDocument(filePath) {
  const settings = loadSettings();
  console.log("API Key:", settings.apiKey);
}