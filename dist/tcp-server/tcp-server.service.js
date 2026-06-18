"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpServerService = void 0;
const format_model_1 = require("../features/format.model");
const tcp_server_instance_1 = require("./tcp-server-instance");
class TcpServerService {
    constructor(sendToRenderer) {
        this.sendToRenderer = sendToRenderer;
        this.servers = new Map();
    }
    async openServer(serverId, port) {
        if (this.servers.has(serverId)) {
            this.servers.get(serverId).close();
            this.servers.delete(serverId);
        }
        const instance = new tcp_server_instance_1.TcpServerInstance(serverId, (id, clients) => {
            this.sendToRenderer("tcp-server:clients-changed", id, clients);
        }, (id, clientId, data) => {
            this.sendToRenderer("tcp-server:data", id, clientId, data.toString("utf8"));
        });
        this.servers.set(serverId, instance);
        await instance.open(port);
        this.sendToRenderer("tcp-server:clients-changed", serverId, instance.getClients());
        return { success: true };
    }
    closeServer(serverId) {
        const server = this.servers.get(serverId);
        if (!server) {
            return { success: false };
        }
        server.close();
        this.servers.delete(serverId);
        this.sendToRenderer("tcp-server:clients-changed", serverId, []);
        return { success: true };
    }
    disconnectClient(serverId, clientId) {
        const server = this.servers.get(serverId);
        if (!server) {
            return { success: false };
        }
        return server.disconnectClient(clientId);
    }
    sendToAllClients(data, format = format_model_1.Format.UTF_8) {
        let sentCount = 0;
        for (const server of this.servers.values()) {
            sentCount += server.sendToAllClients(data, format);
        }
        return { success: sentCount > 0, sentCount };
    }
}
exports.TcpServerService = TcpServerService;
