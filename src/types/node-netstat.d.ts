declare module "node-netstat" {
  interface NetstatFilter {
    protocol?: string;
    pid?: number;
    [key: string]: unknown;
  }

  interface NetstatOptions {
    filter?: NetstatFilter;
    limit?: number;
    sync?: boolean;
    done?: (error?: Error) => void;
  }

  type NetstatHandler = (item: {
    protocol: string;
    local: { port: number; address: string | null };
    remote: { port: number; address: string | null };
    state: string;
    pid: number;
  }) => void;

  function netstat(
    options: NetstatOptions,
    handler: NetstatHandler,
    callbacks?: { done?: (error?: Error) => void }
  ): void;

  export = netstat;
}
