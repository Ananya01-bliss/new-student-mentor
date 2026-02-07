const electron = require('electron');
const { app, BrowserWindow, globalShortcut } = electron;

if (!app) {
    console.error('================================================================');
    console.error('ELECTRON EXECUTION ERROR');
    console.error('================================================================');
    console.error('It looks like you are trying to run this with "node" instead of "electron".');
    console.error('To run the application correctly, please use:');
    console.error('   cmd /c npm run dev');
    console.error('================================================================');
    process.exit(1);
}

const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // In development, load the Angular dev server
    // In production, we would load the dist/index.html
    win.loadURL('http://localhost:4200');

    // Open DevTools for debugging
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    // Register a 'CommandOrControl+N' shortcut listener.
    globalShortcut.register('CommandOrControl+N', () => {
        createWindow();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
