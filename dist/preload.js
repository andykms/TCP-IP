"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    connect: (connectionId, host, port) => electron_1.ipcRenderer.invoke('tcp:connect', connectionId, host, port),
    send: (connectionId, data) => electron_1.ipcRenderer.invoke('tcp:send', connectionId, data),
    sendFile: (connectionId, filePath) => electron_1.ipcRenderer.invoke('tcp:sendFile', connectionId, filePath),
    disconnect: (connectionId) => electron_1.ipcRenderer.invoke('tcp:disconnect', connectionId),
    openFileDialog: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    onData: (callback) => electron_1.ipcRenderer.on('tcp:data', (_, connectionId, data) => callback(connectionId, data)),
    onError: (callback) => electron_1.ipcRenderer.on('tcp:error', (_, connectionId, error) => callback(connectionId, error)),
    onClose: (callback) => electron_1.ipcRenderer.on('tcp:close', (_, connectionId) => callback(connectionId)),
    removeAllListeners: () => {
        electron_1.ipcRenderer.removeAllListeners('tcp:data');
        electron_1.ipcRenderer.removeAllListeners('tcp:error');
        electron_1.ipcRenderer.removeAllListeners('tcp:close');
    }
});
