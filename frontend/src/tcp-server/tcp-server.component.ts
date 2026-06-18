import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { ServerSettingComponent } from './server-setting/server-setting.component';
import { TcpServerService } from './features/tcp-server.service';
import { type TcpServerClient, type TcpServerStatus } from './features/tcp-server-client.model';
import { DataCenterComponent } from '../data-center/data-center.component';
import { TcpData, TcpDataType } from '../tcp/features/tcp-data.model';
import { SendMessage } from '../data-center/features/send-message.model';
import { MessageStatus } from '../data-center/send-message/send-message.component';
import { type TcpServerConnectionInfo } from '../data-center/features/tcp-server-connection-info.model';

@Component({
  selector: 'hercules-tcp-server',
  templateUrl: './tcp-server.component.html',
  styleUrls: ['./tcp-server.component.css'],
  imports: [ServerSettingComponent, DataCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TcpServerComponent implements OnInit {
  private readonly tcpServerService = inject(TcpServerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly serverIds = signal<string[]>(['1']);
  private nextServerId = 2;
  protected readonly serverStatuses = signal<Record<string, TcpServerStatus>>({});
  protected readonly serverPorts = signal<Record<string, number>>({});
  protected readonly clientsByServer = signal<Record<string, TcpServerClient[]>>({});
  protected readonly messages = signal<TcpData[]>([]);
  protected readonly ips = signal<string[]>([]);
  protected readonly ports = signal<number[]>([]);
  protected readonly connectionIds = signal<string[]>([]);
  protected readonly messageStatus = signal<MessageStatus>(null);

  protected readonly allServerConnections = computed<TcpServerConnectionInfo[]>(() => {
    const byServer = this.clientsByServer();
    const ports = this.serverPorts();
    const connections: TcpServerConnectionInfo[] = [];

    for (const [serverId, clients] of Object.entries(byServer)) {
      for (const client of clients) {
        connections.push({
          connectionId: `${serverId}:${client.clientId}`,
          serverId,
          clientId: client.clientId,
          ip: client.ip,
          port: client.port,
          serverPort: ports[serverId] ?? -1,
          status: client.status,
        });
      }
    }

    return connections;
  });

  ngOnInit(): void {
    this.tcpServerService
      .getClientsUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ serverId, clients }) => {
        this.clientsByServer.update((current) => ({
          ...current,
          [serverId]: clients,
        }));
        this.syncFilterOptions();
      });

    this.tcpServerService
      .getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ serverId, clientId, data }) => {
        const client = this.clientsByServer()[serverId]?.find((item) => item.clientId === clientId);
        const connectionId = `${serverId}:${clientId}`;

        this.messages.update((current) => [
          ...current,
          {
            connectionId,
            host: client?.ip ?? 'неизвестный хост',
            port: client?.port ?? -1,
            data,
            timestamp: new Date(),
            type: TcpDataType.RECEIVE,
          },
        ]);
      });
  }

  protected getServerStatus(serverId: string): TcpServerStatus {
    return this.serverStatuses()[serverId] ?? null;
  }

  protected getServerClients(serverId: string): TcpServerClient[] {
    return this.clientsByServer()[serverId] ?? [];
  }

  protected onOpenServer(serverId: string, port: number): void {
    this.updateServerStatus(serverId, 'loading');

    this.tcpServerService
      .openServer(serverId, port)
      .pipe(
        catchError(() => {
          this.updateServerStatus(serverId, 'error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.serverPorts.update((current) => ({
          ...current,
          [serverId]: port,
        }));
        this.updateServerStatus(serverId, 'opened');
      });
  }

  protected onCloseServer(serverId: string): void {
    this.tcpServerService
      .closeServer(serverId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateServerStatus(serverId, null);
        this.clientsByServer.update((current) => ({
          ...current,
          [serverId]: [],
        }));
        this.serverPorts.update((current) => {
          const next = { ...current };
          delete next[serverId];
          return next;
        });
        this.syncFilterOptions();
      });
  }

  protected onDisconnectClient(serverId: string, clientId: string): void {
    this.tcpServerService
      .disconnectClient(serverId, clientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected onDisconnectServerClient(event: { serverId: string; clientId: string }): void {
    this.onDisconnectClient(event.serverId, event.clientId);
  }

  protected onAddServer(): void {
    const serverId = this.nextServerId.toString();
    this.nextServerId++;
    this.serverIds.update((ids) => [...ids, serverId]);
  }

  protected onRemoveServer(serverId: string): void {
    if (this.serverIds().length <= 1) {
      return;
    }

    if (this.getServerStatus(serverId) === 'opened') {
      this.onCloseServer(serverId);
    }

    this.serverIds.update((ids) => ids.filter((id) => id !== serverId));
    this.serverStatuses.update((current) => {
      const next = { ...current };
      delete next[serverId];
      return next;
    });
    this.clientsByServer.update((current) => {
      const next = { ...current };
      delete next[serverId];
      return next;
    });
    this.serverPorts.update((current) => {
      const next = { ...current };
      delete next[serverId];
      return next;
    });
    this.syncFilterOptions();
  }

  protected onSendMessage(message: SendMessage): void {
    this.messageStatus.set('pending');

    this.tcpServerService
      .sendToAllClients(message.data, message.format)
      .pipe(
        catchError(() => {
          this.messageStatus.set('failed');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ success, sentCount }) => {
        if (!success) {
          this.messageStatus.set('failed');
          return;
        }

        this.messages.update((current) => [
          ...current,
          {
            connectionId: 'broadcast',
            host: 'все клиенты',
            port: -1,
            data: `Сообщение отправлено ${sentCount} клиентам`,
            timestamp: new Date(),
            type: TcpDataType.SEND,
          },
        ]);
        this.messageStatus.set('sended');
      });
  }

  private updateServerStatus(serverId: string, status: TcpServerStatus): void {
    this.serverStatuses.update((current) => ({
      ...current,
      [serverId]: status,
    }));
  }

  private syncFilterOptions(): void {
    const connections = this.allServerConnections();

    this.connectionIds.set(connections.map((connection) => connection.connectionId));
    this.ips.set([...new Set(connections.map((connection) => connection.ip))]);
    this.ports.set([...new Set(connections.map((connection) => connection.port))]);
  }
}
