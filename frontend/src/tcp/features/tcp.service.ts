import { Injectable } from '@angular/core';
import { Observable, Subject, catchError, from, of, switchMap, throwError } from 'rxjs';
import { type TcpData, TcpDataType } from './tcp-data.model';
import { type Tcp } from './tcp.model';

declare global {
  interface Window {
    electronAPI: {
      connect: (connectionId: string, host: string, port: number) => Promise<any>;
      send: (connectionId: string, data: string) => Promise<any>;
      disconnect: (connectionId: string) => Promise<any>;
      openFileDialog: () => Promise<void>;
      onData: (callback: (connectionId: string, data: string) => void) => void;
      onError: (callback: (connectionId: string, error: string) => void) => void;
      onClose: (callback: (connectionId: string) => void) => void;
      removeAllListeners: () => void;
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

  connect(host: string, port: number): Observable<{ connectionId: string }> {
    const connectionId = this.connectionId.toString();
    return from(window.electronAPI.connect(connectionId, host, port)).pipe(
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
        return of({ connectionId });
      }),
    );
  }

  send(connectionId: string, data: string): Observable<void> {
    return from(window.electronAPI.send(connectionId, data));
  }

  disconnect(connectionId: string): Observable<void> {
    const disconnectObservable = from(window.electronAPI.disconnect(connectionId));
    return disconnectObservable;
  }

  getData(): Observable<TcpData> {
    return this.dataSubject.asObservable();
  }

  openFileDialog(): Observable<void> {
    return from(window.electronAPI.openFileDialog());
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
