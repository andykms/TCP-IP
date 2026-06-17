import { Injectable } from '@angular/core';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  from,
  merge,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { type TcpData, TcpDataType } from './tcp-data.model';
import { type Tcp } from './tcp.model';
import { MessageFormat } from './message-format.model';
import { LoadingService } from '../../loading/features/loading.service';

declare global {
  interface Window {
    electronAPI: {
      connect: (connectionId: string, host: string, port: number) => Promise<any>;
      send: (
        connectionId: string,
        data: string,
        format: MessageFormat,
      ) => Promise<{ success: boolean }>;
      sendFile: (connectionId: string, filePath: string) => Promise<any>;
      disconnect: (connectionId: string) => Promise<any>;
      getConnections: () => Promise<{ connectionId: string; ip: string; port: number }[]>;
      openFileDialog: () => Promise<{ name: string; path: string; size: number }>;
      onData: (callback: (connectionId: string, data: string) => void) => void;
      onError: (callback: (connectionId: string, error: string) => void) => void;
      onClose: (callback: (connectionId: string) => void) => void;
      removeAllListeners: () => void;
      searchDevices: () => Promise<{ ip: string; port: number }[]>;
      openServer: (serverId: string, port: number) => Promise<{ success: boolean }>;
      closeServer: (serverId: string) => Promise<{ success: boolean }>;
      disconnectServerClient: (serverId: string, clientId: string) => Promise<{ success: boolean }>;
      sendToAllServerClients: (
        data: string,
        format: MessageFormat,
      ) => Promise<{ success: boolean; sentCount: number }>;
      onServerClientsChanged: (
        callback: (
          serverId: string,
          clients: {
            clientId: string;
            ip: string;
            port: number;
            connectedAt: string;
            bytesReceived: number;
            status: 'connected' | 'disconnected';
          }[],
        ) => void,
      ) => void;
      onServerData: (callback: (serverId: string, clientId: string, data: string) => void) => void;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class TcpService {
  private dataSubject = new Subject<TcpData>();
  private ipsSubject = new Subject<string>();
  private portsSubject = new Subject<number>();
  private connectionIdSubject = new Subject<string>();
  private readonly connections = new Map<string, Tcp>();
  private connectionId = 1;

  constructor() {
    if (!window.electronAPI) {
      return;
    }

    window.electronAPI.onData((connectionId: string, data: string) => {
      const tcpConfig = this.connections.get(connectionId);
      if (!tcpConfig) {
        this.dataSubject.next({
          connectionId,
          data,
          timestamp: new Date(),
          type: TcpDataType.RECEIVE,
          host: 'неизвестный хост',
          port: -1,
        });
        return;
      }
      this.dataSubject.next({
        connectionId,
        data,
        timestamp: new Date(),
        type: TcpDataType.RECEIVE,
        host: tcpConfig.host,
        port: tcpConfig.port,
      });
    });

    window.electronAPI.onError((connectionId: string, error: string) => {
      const tcpConfig = this.connections.get(connectionId);
      this.dataSubject.next({
        connectionId,
        data: error,
        timestamp: new Date(),
        type: TcpDataType.ERROR,
        host: tcpConfig?.host ?? 'неизвестный хост',
        port: tcpConfig?.port ?? -1,
      });
    });

    window.electronAPI.onClose((connectionId: string) => {
      const tcpConfig = this.connections.get(connectionId);
      if (!tcpConfig) {
        this.dataSubject.next({
          connectionId,
          data: 'Система: завершено соединение',
          timestamp: new Date(),
          type: TcpDataType.DISCONNECT,
          host: 'неизвестный хост',
          port: -1,
        });
        return;
      }
      this.connections.delete(connectionId);
      this.dataSubject.next({
        connectionId,
        data: 'Система: завершено соединение',
        timestamp: new Date(),
        type: TcpDataType.DISCONNECT,
        host: tcpConfig.host,
        port: tcpConfig.port,
      });
    });
  }

  connect(
    host: string,
    port: number,
  ): Observable<{ connectionId: string; host: string; port: number; status: TcpDataType }> {
    const connectionId = this.connectionId.toString();
    const connectionObserver = from(window.electronAPI.connect(connectionId, host, port)).pipe(
      catchError((error) => {
        this.dataSubject.next({
          connectionId,
          data: error,
          timestamp: new Date(),
          type: TcpDataType.ERROR,
          host,
          port,
        });
        return throwError(error);
      }),
      switchMap(() => {
        this.connectionId++;
        this.connections.set(connectionId, { host, port });
        this.ipsSubject.next(host);
        this.portsSubject.next(port);
        this.connectionIdSubject.next(connectionId);
        return of({ connectionId, host, port, status: TcpDataType.CONNECT });
      }),
    );

    const disconnectObservable = new Observable<{
      connectionId: string;
      host: string;
      port: number;
      status: TcpDataType;
    }>((observer) => {
      window.electronAPI.onClose((closedConnectionId: string) => {
        if (closedConnectionId === connectionId)
          observer.next({ connectionId, host, port, status: TcpDataType.DISCONNECT });
      });
    });

    return merge(connectionObserver, disconnectObservable);
  }

  send(
    connectionId: string,
    data: string,
    format: MessageFormat = MessageFormat.UTF_8,
  ): Observable<{ success: boolean }> {
    return from(window.electronAPI.send(connectionId, data, format)).pipe(
      catchError((error) => {
        this.dataSubject.next({
          connectionId,
          data: `Не удалось отправить данные: ${error}`,
          timestamp: new Date(),
          type: TcpDataType.ERROR,
          host: this.connections.get(connectionId)?.host ?? 'неизвестный хост',
          port: this.connections.get(connectionId)?.port ?? -1,
        });
        return EMPTY;
      }),
      tap(() => {
        this.dataSubject.next({
          connectionId,
          data: `Сообщение: "${data}" отправлено успешно`,
          timestamp: new Date(),
          type: TcpDataType.SEND,
          host: this.connections.get(connectionId)?.host ?? 'неизвестный хост',
          port: this.connections.get(connectionId)?.port ?? -1,
        });
      }),
    );
  }

  disconnect(connectionId: string): Observable<void> {
    return from(window.electronAPI.disconnect(connectionId)).pipe(
      tap(() => this.connections.delete(connectionId)),
    );
  }

  getConnections(): Observable<{ connectionId: string; ip: string; port: number }[]> {
    if (!window.electronAPI?.getConnections) {
      return of([]);
    }

    return from(window.electronAPI.getConnections());
  }

  getData(): Observable<TcpData> {
    return this.dataSubject.asObservable();
  }

  openFileDialog(): Observable<{ name: string; path: string; size: number }> {
    return from(window.electronAPI.openFileDialog());
  }

  sendFile(connectionId: string, filePath: string): Observable<void> {
    const subscription = from(window.electronAPI.sendFile(connectionId, filePath)).pipe(
      catchError((error) => {
        this.dataSubject.next({
          connectionId,
          data: `Не удалось отправить файл: ${error}`,
          timestamp: new Date(),
          type: TcpDataType.ERROR,
          host: this.connections.get(connectionId)?.host ?? 'неизвестный хост',
          port: this.connections.get(connectionId)?.port ?? -1,
        });
        return EMPTY;
      }),
      finalize(() => {
        this.dataSubject.next({
          connectionId,
          data: `Файл: "${filePath}" отправлен успешно`,
          timestamp: new Date(),
          type: TcpDataType.SEND,
          host: this.connections.get(connectionId)?.host ?? 'неизвестный хост',
          port: this.connections.get(connectionId)?.port ?? -1,
        });
      }),
    );
    return subscription;
  }

  getIp(): Observable<string> {
    return this.ipsSubject.asObservable();
  }

  getPort(): Observable<number> {
    return this.portsSubject.asObservable();
  }

  getConnectionId(): Observable<string> {
    return this.connectionIdSubject.asObservable();
  }
}
