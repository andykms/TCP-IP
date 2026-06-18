import { Injectable } from '@angular/core';
import { Observable, Subject, from } from 'rxjs';
import { MessageFormat } from '../../tcp/features/message-format.model';
import { type TcpServerClient } from './tcp-server-client.model';

@Injectable({
  providedIn: 'root',
})
export class TcpServerService {
  private readonly clientsSubject = new Subject<{
    serverId: string;
    clients: TcpServerClient[];
  }>();
  private readonly dataSubject = new Subject<{
    serverId: string;
    clientId: string;
    data: string;
  }>();

  constructor() {
    if (!window.electronAPI?.onServerClientsChanged) {
      return;
    }

    window.electronAPI.onServerClientsChanged((serverId, clients) => {
      this.clientsSubject.next({ serverId, clients });
    });

    window.electronAPI.onServerData((serverId, clientId, data) => {
      this.dataSubject.next({ serverId, clientId, data });
    });
  }

  openServer(serverId: string, port: number): Observable<{ success: boolean }> {
    return from(window.electronAPI.openServer(serverId, port));
  }

  closeServer(serverId: string): Observable<{ success: boolean }> {
    return from(window.electronAPI.closeServer(serverId));
  }

  disconnectClient(serverId: string, clientId: string): Observable<{ success: boolean }> {
    return from(window.electronAPI.disconnectServerClient(serverId, clientId));
  }

  sendToAllClients(
    data: string,
    format: MessageFormat = MessageFormat.UTF_8,
  ): Observable<{ success: boolean; sentCount: number }> {
    return from(window.electronAPI.sendToAllServerClients(data, format));
  }

  getClientsUpdates(): Observable<{ serverId: string; clients: TcpServerClient[] }> {
    return this.clientsSubject.asObservable();
  }

  getData(): Observable<{ serverId: string; clientId: string; data: string }> {
    return this.dataSubject.asObservable();
  }
}
