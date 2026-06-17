import netstat from "node-netstat";
import { TcpDeviceConnection } from "../features/tcp-device.model";

interface NetstatItem {
  protocol: string;
  local: { port: number; address: string | null };
  remote: { port: number; address: string | null };
  state: string;
  pid: number;
}

const SEARCH_DURATION_MS = 3000;
const POLL_INTERVAL_MS = 300;

const LOCAL_ADDRESSES = new Set(["0.0.0.0", "127.0.0.1", "::1", "*", "::"]);

export class DeviceSearchService {
  search(): Promise<TcpDeviceConnection[]> {
    const results = new Map<string, TcpDeviceConnection>();
    const deadline = Date.now() + SEARCH_DURATION_MS;

    return new Promise((resolve) => {
      let finished = false;

      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;

        resolve(
          Array.from(results.values()).sort(
            (a, b) => a.ip.localeCompare(b.ip) || a.port - b.port
          )
        );
      };

      setTimeout(finish, SEARCH_DURATION_MS);

      const poll = () => {
        if (finished) {
          return;
        }

        netstat(
          { filter: { protocol: "tcp" } },
          (item: NetstatItem) => {
            this.collectConnection(item, results);
          },
          {
            done: () => {
              if (finished) {
                return;
              }

              if (Date.now() < deadline) {
                setTimeout(poll, POLL_INTERVAL_MS);
              } else {
                finish();
              }
            },
          }
        );
      };

      poll();
    });
  }

  private collectConnection(
    item: NetstatItem,
    results: Map<string, TcpDeviceConnection>
  ): void {
    this.addEndpoint(item.local, results);
    this.addEndpoint(item.remote, results);
  }

  private addEndpoint(
    endpoint: { port: number; address: string | null },
    results: Map<string, TcpDeviceConnection>
  ): void {
    if (!endpoint?.address || !endpoint.port || Number.isNaN(endpoint.port)) {
      return;
    }

    const ip = endpoint.address;
    
    const key = `${ip}:${endpoint.port}`;
    results.set(key, { ip, port: endpoint.port });
  }
}
