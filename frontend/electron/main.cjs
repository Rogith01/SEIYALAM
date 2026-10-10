
const { app, BrowserWindow, dialog } = require("electron");
const path = require("node:path");
const { autoUpdater } = require("electron-updater");

let mainWindow;

function createWindow() {
  const iconPath = path.join(app.getAppPath(), "build", "sei.ico");

  mainWindow = new BrowserWindow({
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
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://127.0.0.1:5173");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for SEIYALAM updates...");
  });

  autoUpdater.on("update-available", async (info) => {
    if (!mainWindow) return;

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "SEIYALAM Update Available",
      message: `Version ${info.version} is available.`,
      detail: "Would you like to download the update now?",
      buttons: ["Update Now", "Later"],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      autoUpdater.downloadUpdate().catch((error) => {
        dialog.showErrorBox(
          "Update Download Failed",
          error.message
        );
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log("SEIYALAM is up to date.");
  });

  autoUpdater.on("error", (error) => {
    console.error("SEIYALAM updater error:", error.message);
  });

  autoUpdater.on("update-downloaded", async (info) => {
    if (!mainWindow) return;

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "SEIYALAM Update Ready",
      message: `Version ${info.version} has been downloaded.`,
      detail: "Restart SEIYALAM to install the update.",
      buttons: ["Restart & Install", "Later"],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("Update check failed:", error.message);
    });
  }, 5000);
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

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
