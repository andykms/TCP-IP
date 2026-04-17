import { TcpClientConfigurationModel } from './tcp-client-configuration.model';

export interface TcpClientCollectionModel {
  name: string;
  configurations: TcpClientConfigurationModel[];
}
