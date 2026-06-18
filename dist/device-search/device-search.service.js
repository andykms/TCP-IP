"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSearchService = void 0;
const node_netstat_1 = __importDefault(require("node-netstat"));
const SEARCH_DURATION_MS = 3000;
const POLL_INTERVAL_MS = 300;
const LOCAL_ADDRESSES = new Set(["0.0.0.0", "127.0.0.1", "::1", "*", "::"]);
class DeviceSearchService {
    search() {
        const results = new Map();
        const deadline = Date.now() + SEARCH_DURATION_MS;
        return new Promise((resolve) => {
            let finished = false;
            const finish = () => {
                if (finished) {
                    return;
                }
                finished = true;
                resolve(Array.from(results.values()).sort((a, b) => a.ip.localeCompare(b.ip) || a.port - b.port));
            };
            setTimeout(finish, SEARCH_DURATION_MS);
            const poll = () => {
                if (finished) {
                    return;
                }
                (0, node_netstat_1.default)({ filter: { protocol: "tcp" } }, (item) => {
                    this.collectConnection(item, results);
                }, {
                    done: () => {
                        if (finished) {
                            return;
                        }
                        if (Date.now() < deadline) {
                            setTimeout(poll, POLL_INTERVAL_MS);
                        }
                        else {
                            finish();
                        }
                    },
                });
            };
            poll();
        });
    }
    collectConnection(item, results) {
        this.addEndpoint(item.local, results);
        this.addEndpoint(item.remote, results);
    }
    addEndpoint(endpoint, results) {
        if (!endpoint?.address || !endpoint.port || Number.isNaN(endpoint.port)) {
            return;
        }
        const ip = endpoint.address;
        const key = `${ip}:${endpoint.port}`;
        results.set(key, { ip, port: endpoint.port });
    }
}
exports.DeviceSearchService = DeviceSearchService;
