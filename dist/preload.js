"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
var Format;
(function (Format) {
    Format["HEX"] = "hex";
    Format["ASCII"] = "ascii";
    Format["UTF_8"] = "utf-8";
})(Format || (Format = {}));
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    connect: (connectionId, host, port) => electron_1.ipcRenderer.invoke('tcp:connect', connectionId, host, port),
    send: (connectionId, data, format) => electron_1.ipcRenderer.invoke('tcp:send', connectionId, data, format),
    sendFile: (connectionId, filePath) => electron_1.ipcRenderer.invoke('tcp:sendFile', connectionId, filePath),
    disconnect: (connectionId) => electron_1.ipcRenderer.invoke('tcp:disconnect', connectionId),
    getConnections: () => electron_1.ipcRenderer.invoke('tcp:getConnections'),
    openFileDialog: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    searchDevices: () => electron_1.ipcRenderer.invoke('device-search:search'),
    openServer: (serverId, port) => electron_1.ipcRenderer.invoke('tcp-server:open', serverId, port),
    closeServer: (serverId) => electron_1.ipcRenderer.invoke('tcp-server:close', serverId),
    disconnectServerClient: (serverId, clientId) => electron_1.ipcRenderer.invoke('tcp-server:disconnect-client', serverId, clientId),
    sendToAllServerClients: (data, format) => electron_1.ipcRenderer.invoke('tcp-server:send-to-all', data, format),
    onServerClientsChanged: (callback) => electron_1.ipcRenderer.on('tcp-server:clients-changed', (_, serverId, clients) => callback(serverId, clients)),
    onServerData: (callback) => electron_1.ipcRenderer.on('tcp-server:data', (_, serverId, clientId, data) => callback(serverId, clientId, data)),
    onData: (callback) => electron_1.ipcRenderer.on('tcp:data', (_, connectionId, data) => callback(connectionId, data)),
    onError: (callback) => electron_1.ipcRenderer.on('tcp:error', (_, connectionId, error) => callback(connectionId, error)),
    onClose: (callback) => electron_1.ipcRenderer.on('tcp:close', (_, connectionId) => callback(connectionId)),
    removeAllListeners: () => {
        electron_1.ipcRenderer.removeAllListeners('tcp:data');
        electron_1.ipcRenderer.removeAllListeners('tcp:error');
        electron_1.ipcRenderer.removeAllListeners('tcp:close');
        electron_1.ipcRenderer.removeAllListeners('tcp-server:clients-changed');
        electron_1.ipcRenderer.removeAllListeners('tcp-server:data');
    }
});
