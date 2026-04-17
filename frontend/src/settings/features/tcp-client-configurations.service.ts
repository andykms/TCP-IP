import { Injectable } from '@angular/core';
import * as collections from './tcp-client.configurations.json';

@Injectable({
  providedIn: 'root',
})
export class TcpClientConfigurationsService {
  getCollections() {
    return collections;
  }

  addCollection(collection: any) {
    collections.push(collection);
  }
}
