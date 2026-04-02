import { Injectable, NgZone } from "@angular/core";
import { Observable, Subject, from } from "rxjs";
import { type TcpData, TcpDataType} from "./tcp-data.model";


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
  providedIn: "root"
})
export class TcpService {
  private dataSubject = new Subject<TcpData>();


  constructor() {
    if(!window.electronAPI) {
      return;
    }

    window.electronAPI.onData((connectionId: string, data: string) => {
      this.dataSubject.next({connectionId, data, timestamp: new Date(), type: TcpDataType.RECEIVE})
    });

    window.electronAPI.onError((connectionId: string, error: string) => {
      this.dataSubject.next({connectionId, data: error, timestamp: new Date(), type: TcpDataType.ERROR})
    });

    window.electronAPI.onClose((connectionId: string) => {
      this.dataSubject.next({connectionId, data: "", timestamp: new Date(), type: TcpDataType.DISCONNECT})
    });
  }

  connect(connectionId: string, host: string, port: number): Observable<void> {
    return from(window.electronAPI.connect(connectionId, host, port));
  }

  send(connectionId: string, data: string): Observable<void> {
    return from(window.electronAPI.send(connectionId, data));
  }

  disconnect(connectionId: string): Observable<void> {
    return from(window.electronAPI.disconnect(connectionId));
  }

  getData(): Observable<TcpData> {
    return this.dataSubject.asObservable();
  }

  openFileDialog(): Observable<void> {
    return from(window.electronAPI.openFileDialog());
  }
}