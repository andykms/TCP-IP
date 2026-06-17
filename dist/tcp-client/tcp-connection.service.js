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
exports.TcpConnectionService = void 0;
const net = __importStar(require("net"));
class TcpConnectionService {
    constructor(connectionId) {
        this.host = "";
        this.port = 0;
        this.dataListeners = [];
        this.errorListeners = [];
        this.closeListeners = [];
        this.id = connectionId;
        this.socket = new net.Socket();
        this.socket.on("data", (data) => {
            this.dataListeners.forEach((listener) => {
                listener(data);
            });
        });
        this.socket.on("error", (error) => {
            this.errorListeners.forEach((listener) => {
                listener(error);
            });
        });
        this.socket.on("close", (hadError) => {
            this.closeListeners.forEach((listener) => {
                listener(hadError);
            });
            this.disconnect();
        });
        return this;
    }
    connect(port, host, listener) {
        this.host = host;
        this.port = port;
        this.socket.connect(port, host, listener);
    }
    addDataListener(listener) {
        this.dataListeners.push(listener);
    }
    addErrorListener(listener) {
        this.errorListeners.push(listener);
    }
    addCloseListener(listener) {
        this.closeListeners.push(listener);
    }
    disconnect() {
        this.socket.destroy();
        this.removeAllListeners();
        console.log("соед.дисконект");
    }
    removeAllListeners() {
        this.dataListeners = [];
        this.errorListeners = [];
        this.closeListeners = [];
    }
    get getUnsafedSocket() {
        return this.socket;
    }
}
exports.TcpConnectionService = TcpConnectionService;
