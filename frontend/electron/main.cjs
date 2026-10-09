const { app, BrowserWindow } = require("electron");
const path = require("node:path");

function createWindow() {
const iconPath = path.join(app.getAppPath(), "build", "sei.ico");

const win = new BrowserWindow({
width: 1400,
height: 900,
minWidth: 1000,
minHeight: 700,
title: "SEIYALAM",
icon: iconPath,
autoHideMenuBar: true,
webPreferences: {
nodeIntegration: false,
contextIsolation: true,
sandbox: true,
devTools: false
}
});

if (app.isPackaged) {
win.loadFile(path.join(__dirname, "../dist/index.html"));
} else {
win.loadURL("http://localhost:5173");
}
}

app.whenReady().then(() => {
createWindow();

app.on("activate", () => {
if (BrowserWindow.getAllWindows().length === 0) {
createWindow();
}
});
});

app.on("window-all-closed", () => {
if (process.platform !== "darwin") {
app.quit();
}
});
