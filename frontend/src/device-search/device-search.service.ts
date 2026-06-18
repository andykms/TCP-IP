import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { type TcpDevice } from './features/tcp-device.model';

@Injectable({
  providedIn: 'root',
})
export class DeviceSearchService {
  search(): Observable<TcpDevice[]> {
    if (!window.electronAPI?.searchDevices) {
      return from(Promise.resolve([]));
    }

    return from(window.electronAPI.searchDevices());
  }
}
