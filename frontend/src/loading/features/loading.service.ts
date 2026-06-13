import { Injectable } from "@angular/core";
import { BehaviorSubject, finalize, Observable, ReplaySubject, Subject } from "rxjs";

export enum LoadingType {
  SEND_MESSAGE = 'SEND_MESSAGE',
  CONNECT_TCP_CLIENT = 'CONNECT_TCP_CLIENT',
}

@Injectable({
    providedIn: 'root',
})
export class LoadingService {
  private isLoadingSendMessage = new Subject<boolean>();
  private isLoadingConnectTcpClient = new Subject<boolean>();

  public get isLoadingSendMessage$(): Observable<boolean> {
    return this.isLoadingSendMessage.asObservable();
  }

  public get isLoadingConnectTcpClient$(): Observable<boolean> {
    return this.isLoadingConnectTcpClient.asObservable();
  }

  public loadedObservable<T>(type: LoadingType, observable: Observable<T>): Observable<T> {
    switch (type) {
      case LoadingType.SEND_MESSAGE:
        this.isLoadingSendMessage.next(true);
        break;
      case LoadingType.CONNECT_TCP_CLIENT:
        this.isLoadingConnectTcpClient.next(true);
        break;
    }
    return observable.pipe(
      finalize(() => {
        switch (type) {
          case LoadingType.SEND_MESSAGE:
            this.isLoadingSendMessage.next(false);
            break;
          case LoadingType.CONNECT_TCP_CLIENT:
            this.isLoadingConnectTcpClient.next(false);
            break;
        }
      }),
    );
  }
}