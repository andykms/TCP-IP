import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeviceSearchService } from '../device-search.service';
import { type TcpDevice } from './tcp-device.model';

@Injectable({
  providedIn: 'root',
})
export class DeviceSearchAdapter {
  constructor(private readonly deviceSearchService: DeviceSearchService) {}

  findDevices(): Observable<TcpDevice[]> {
    return this.deviceSearchService.search();
  }
}
