"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const net = __importStar(require("net")); // для TCP-клиента
const fs = __importStar(require("fs"));
const promises_1 = require("stream/promises");
const CONNECTION_TIMEOUT = 15000;
let mainWindow = null;
const menu = electron_1.Menu.buildFromTemplate([
    { label: 'View', submenu: [
            { label: 'Toggle Developer Tools', accelerator: 'Ctrl+I', click: () => { mainWindow?.webContents.toggleDevTools(); } }
        ] }
]);
electron_1.Menu.setApplicationMenu(menu);
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:4200');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/frontend/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    setupIpcHandlers();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
let connections = new Map();
function setupIpcHandlers() {
    electron_1.ipcMain.handle("tcp:connect", async (event, connectionId, host, port) => {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const timeout = setTimeout(() => {
                socket.destroy();
                reject(new Error("Система: время подключения истекло"));
            }, CONNECTION_TIMEOUT);
            socket.connect(port, host, () => {
                clearTimeout(timeout);
                connections.set(connectionId, { socket, id: connectionId });
                socket.on("data", (data) => {
                    if (mainWindow) {
                        mainWindow.webContents.send("tcp:data", connectionId, data.toString("utf8"));
                    }
                });
                socket.on("error", (err) => {
                    if (mainWindow) {
                        mainWindow.webContents.send("tcp:error", connectionId, err.message);
                    }
                    connections.delete(connectionId);
                });
                socket.on('close', () => {
                    connections.delete(connectionId);
                    if (mainWindow) {
                        mainWindow.webContents.send("tcp:close", connectionId);
                    }
                });
                resolve({ success: true });
            });
            socket.on("error", (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    });
    electron_1.ipcMain.handle("tcp:send", async (event, connectionId, data) => {
        const connection = connections.get(connectionId);
        if (!connection) {
            throw new Error("Система: подключение не найдено");
        }
        connection.socket.write(data);
        return { success: true };
    });
    electron_1.ipcMain.handle("tcp:disconnect", async (event, connectionId) => {
        const connection = connections.get(connectionId);
        if (connection) {
            connection.socket.destroy();
            connections.delete(connectionId);
        }
        return { success: true };
    });
    electron_1.ipcMain.handle("tcp:sendFile", async (event, connectionId, filePath) => {
        const connection = connections.get(connectionId);
        if (!connection) {
            throw new Error("Система: подключение не найдено");
        }
        try {
            const stats = await fs.promises.stat(filePath);
            const fileName = path.basename(filePath);
            const fileSize = stats.size;
            const header = JSON.stringify({
                type: "file",
                name: fileName,
                size: fileSize
            });
            connection.socket.write(header);
            const readStream = fs.createReadStream(filePath);
            await (0, promises_1.pipeline)(readStream, connection.socket, { end: false });
            return { success: true, fileName, fileSize };
        }
        catch (err) {
            throw err;
        }
    });
    electron_1.ipcMain.handle("dialog:openFile", async () => {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openFile']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });
}
