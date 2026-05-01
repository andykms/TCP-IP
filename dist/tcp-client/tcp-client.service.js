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
exports.TcpClientService = void 0;
const format_model_1 = require("../features/format.model");
const tcp_connection_service_1 = require("./tcp-connection.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const promises_1 = require("stream/promises");
class TcpClientService {
    constructor() {
        this.connections = new Map();
        this.CONNECTION_TIMEOUT = 10000;
    }
    connect(connectionId, host, port) {
        return new Promise((resolve, reject) => {
            if (this.connections.has(connectionId)) {
                this.connections.get(connectionId).disconnect();
            }
            const newConnection = new tcp_connection_service_1.TcpConnectionService(connectionId);
            this.connections.set(connectionId, newConnection);
            const timeout = setTimeout(() => {
                newConnection.disconnect();
                reject(new Error("Система: время подключения истекло"));
            }, this.CONNECTION_TIMEOUT);
            newConnection.addCloseListener(() => {
                this.connections.delete(connectionId);
                console.log("удал.соед.откл");
                console.log(this.connections.keys());
            });
            newConnection.addErrorListener((err) => {
                this.connections.delete(connectionId);
                console.log("удал.соед.ошиб");
                console.log(this.connections.keys());
            });
            newConnection.connect(port, host, () => {
                clearTimeout(timeout);
                return resolve(newConnection);
            });
        });
    }
    disconnect(connectionId) {
        if (this.connections.has(connectionId)) {
            this.connections.get(connectionId).disconnect();
            return { success: true };
        }
    }
    async sendData(connectionId, data, format = format_model_1.Format.UTF_8) {
        const connection = this.connections.get(connectionId);
        const buffer = Buffer.from(data, format);
        if (!connection) {
            return Promise.reject(new Error("Система: подключение не найдено"));
        }
        const successfully = connection.getUnsafedSocket.write(buffer);
        if (successfully)
            return Promise.resolve({ success: true });
        else
            throw new Error("Система: ошибка отправки данных");
    }
    async sendFile(connectionId, filePath) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return Promise.reject(new Error("Система: подключение не найдено"));
        }
        try {
            const stats = await fs.promises.stat(filePath);
            const fileName = path.basename(filePath);
            const fileSize = stats.size;
            const header = JSON.stringify({
                type: "file",
                name: fileName,
                size: fileSize,
            });
            connection.getUnsafedSocket.write(header);
            const readStream = fs.createReadStream(filePath);
            await (0, promises_1.pipeline)(readStream, connection.getUnsafedSocket, { end: false });
            return Promise.resolve({ success: true, fileName, fileSize });
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}
exports.TcpClientService = TcpClientService;
