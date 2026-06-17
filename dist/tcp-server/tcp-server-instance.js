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
exports.TcpServerInstance = void 0;
const net = __importStar(require("net"));
class TcpServerInstance {
    constructor(serverId, onClientsChanged, onData) {
        this.serverId = serverId;
        this.onClientsChanged = onClientsChanged;
        this.onData = onData;
        this.server = null;
        this.clients = new Map();
        this.banned = new Set();
        this.sockets = new Map();
        this.clientIdCounter = 1;
        this.port = 0;
    }
    open(port) {
        return new Promise((resolve, reject) => {
            if (this.server) {
                reject(new Error("Система: сервер уже открыт"));
                return;
            }
            this.port = port;
            this.server = net.createServer((socket) => {
                const ip = this.normalizeAddress(socket.remoteAddress ?? "");
                const remotePort = socket.remotePort ?? 0;
                const banKey = `${ip}:${remotePort}`;
                if (this.banned.has(banKey)) {
                    socket.destroy();
                    return;
                }
                const clientId = this.clientIdCounter.toString();
                this.clientIdCounter++;
                const client = {
                    clientId,
                    ip,
                    port: remotePort,
                    connectedAt: new Date().toISOString(),
                    bytesReceived: 0,
                    status: "connected",
                };
                this.clients.set(clientId, client);
                this.sockets.set(clientId, socket);
                this.notifyClientsChanged();
                socket.on("data", (data) => {
                    const currentClient = this.clients.get(clientId);
                    if (!currentClient || currentClient.status !== "connected") {
                        return;
                    }
                    currentClient.bytesReceived += data.length;
                    this.notifyClientsChanged();
                    this.onData?.(this.serverId, clientId, data);
                });
                const handleDisconnect = () => {
                    const currentClient = this.clients.get(clientId);
                    if (!currentClient || currentClient.status !== "connected") {
                        return;
                    }
                    currentClient.status = "disconnected";
                    this.sockets.delete(clientId);
                    this.notifyClientsChanged();
                };
                socket.on("close", handleDisconnect);
                socket.on("error", handleDisconnect);
            });
            this.server.once("error", (error) => {
                this.server = null;
                this.port = 0;
                reject(error);
            });
            this.server.listen(port, () => resolve());
        });
    }
    disconnectClient(clientId) {
        const client = this.clients.get(clientId);
        const socket = this.sockets.get(clientId);
        if (!client || !socket || client.status !== "connected") {
            return { success: false };
        }
        this.banned.add(`${client.ip}:${client.port}`);
        socket.destroy();
        this.sockets.delete(clientId);
        client.status = "disconnected";
        this.notifyClientsChanged();
        return { success: true };
    }
    close() {
        for (const socket of this.sockets.values()) {
            socket.destroy();
        }
        this.sockets.clear();
        this.server?.close();
        this.server = null;
        this.port = 0;
        for (const client of this.clients.values()) {
            if (client.status === "connected") {
                client.status = "disconnected";
            }
        }
        this.notifyClientsChanged();
    }
    getClients() {
        return Array.from(this.clients.values());
    }
    sendToAllClients(data, format) {
        const buffer = Buffer.from(data, format);
        let sentCount = 0;
        for (const [clientId, socket] of this.sockets.entries()) {
            const client = this.clients.get(clientId);
            if (!client || client.status !== "connected") {
                continue;
            }
            socket.write(buffer);
            sentCount++;
        }
        return sentCount;
    }
    notifyClientsChanged() {
        this.onClientsChanged(this.serverId, this.getClients());
    }
    normalizeAddress(address) {
        return address.replace(/^::ffff:/, "");
    }
}
exports.TcpServerInstance = TcpServerInstance;
