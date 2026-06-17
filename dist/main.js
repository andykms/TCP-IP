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
const fs = __importStar(require("fs"));
const tcp_client_service_1 = require("./tcp-client/tcp-client.service");
const device_search_service_1 = require("./device-search/device-search.service");
const tcp_server_service_1 = require("./tcp-server/tcp-server.service");
const format_model_1 = require("./features/format.model");
const tcpClientService = new tcp_client_service_1.TcpClientService();
const deviceSearchService = new device_search_service_1.DeviceSearchService();
let tcpServerService;
let mainWindow = null;
const menu = electron_1.Menu.buildFromTemplate([
    {
        label: "View",
        submenu: [
            {
                label: "Toggle Developer Tools",
                accelerator: "Ctrl+I",
                click: () => {
                    mainWindow?.webContents.toggleDevTools();
                },
            },
        ],
    },
]);
electron_1.Menu.setApplicationMenu(menu);
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (process.env.NODE_ENV === "development") {
        mainWindow.loadURL("http://localhost:4200");
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "../dist/frontend/index.html"));
    }
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    setupIpcHandlers();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
function setupIpcHandlers() {
    tcpServerService = new tcp_server_service_1.TcpServerService((channel, ...args) => {
        mainWindow?.webContents.send(channel, ...args);
    });
    electron_1.ipcMain.handle("tcp:connect", async (event, connectionId, host, port) => {
        const tcpConnection = await tcpClientService.connect(connectionId, host, port);
        tcpConnection.addDataListener((data) => {
            if (mainWindow) {
                mainWindow.webContents.send("tcp:data", connectionId, data.toString("utf8"));
            }
        });
        tcpConnection.addErrorListener((err) => {
            if (mainWindow) {
                mainWindow.webContents.send("tcp:error", connectionId, err.message);
            }
        });
        tcpConnection.addCloseListener(() => {
            if (mainWindow) {
                mainWindow.webContents.send("tcp:close", connectionId);
            }
        });
        return { success: true };
    });
    electron_1.ipcMain.handle("tcp:send", async (event, connectionId, data, format = format_model_1.Format.UTF_8) => await tcpClientService.sendData(connectionId, data, format));
    electron_1.ipcMain.handle("tcp:disconnect", async (event, connectionId) => {
        tcpClientService.disconnect(connectionId);
    });
    electron_1.ipcMain.handle("tcp:sendFile", async (event, connectionId, filePath) => await tcpClientService.sendFile(connectionId, filePath));
    electron_1.ipcMain.handle("tcp:getConnections", async () => tcpClientService.getConnections());
    electron_1.ipcMain.handle("device-search:search", async () => deviceSearchService.search());
    electron_1.ipcMain.handle("tcp-server:open", async (_event, serverId, port) => tcpServerService.openServer(serverId, port));
    electron_1.ipcMain.handle("tcp-server:close", async (_event, serverId) => tcpServerService.closeServer(serverId));
    electron_1.ipcMain.handle("tcp-server:disconnect-client", async (_event, serverId, clientId) => tcpServerService.disconnectClient(serverId, clientId));
    electron_1.ipcMain.handle("tcp-server:send-to-all", async (_event, data, format = format_model_1.Format.UTF_8) => tcpServerService.sendToAllClients(data, format));
    electron_1.ipcMain.handle("dialog:openFile", async () => {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ["openFile"],
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            try {
                const stats = await fs.promises.stat(filePath);
                const fileName = path.basename(filePath);
                const fileSize = stats.size;
                const fileInfo = {
                    name: fileName,
                    size: fileSize,
                    path: filePath,
                };
                return fileInfo;
            }
            catch (err) {
                throw err;
            }
        }
        return null;
    });
}
