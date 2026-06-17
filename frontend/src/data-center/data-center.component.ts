import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HercBottomSeparatorComponent } from '../shared/util-components/bottom-separator/bottom-separator.component';
import { TcpData } from '../tcp/features/tcp-data.model';
import { MessagesComponent } from './messages/messages.component';
import {
  MessageStatus,
  SendMessageComponent,
  type SendMessageMode,
} from './send-message/send-message.component';
import {
  TcpConnectionsComponent,
  type TcpConnectionsMode,
} from './tcp-connections/tcp-connections.component';
import { SendMessage } from './features/send-message.model';
import { type TcpConnectionInfo } from './features/tcp-connection-info.model';
import { type TcpServerConnectionInfo } from './features/tcp-server-connection-info.model';

enum Tabs {
  Messages = 'Сообщения',
  SendMessage = 'Отправить сообщение',
  SendFile = 'Отправить файл',
  TcpConnections = 'TCP подключения',
}

@Component({
  selector: 'hercules-data-center',
  templateUrl: './data-center.component.html',
  styleUrls: ['./data-center.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HercBottomSeparatorComponent,
    MessagesComponent,
    SendMessageComponent,
    TcpConnectionsComponent,
  ],
})
export class DataCenterComponent {
  public mode = input<SendMessageMode>('client');
  public messages = input<TcpData[]>([]);
  public ips = input<string[]>(['127.0.0.1', '192.168.1.1']);
  public ports = input<number[]>([]);
  public connectionIds = input<string[]>([]);
  public serverConnections = input<TcpServerConnectionInfo[]>([]);
  protected sendMessage = output<SendMessage>();
  protected disconnectServerClient = output<{ serverId: string; clientId: string }>();
  public messageStatus = input<MessageStatus>(null);

  protected readonly connections = computed<TcpConnectionInfo[]>(() => {
    const ids = this.connectionIds();
    const ips = this.ips();
    const ports = this.ports();

    return ids.map((connectionId, index) => ({
      connectionId,
      ip: ips[index] ?? '',
      port: ports[index] ?? -1,
    }));
  });

  protected readonly messagesTab = Tabs.Messages;
  protected readonly sendMessageTab = Tabs.SendMessage;
  protected readonly sendFileTab = Tabs.SendFile;
  protected readonly tcpConnectionsTab = Tabs.TcpConnections;

  protected readonly activeTab = signal<string>(Tabs.Messages);

  protected get tcpConnectionsMode(): TcpConnectionsMode {
    return this.mode();
  }

  protected onSetTab(tab: string) {
    this.activeTab.set(tab);
  }

  protected onSendMessage(message: SendMessage) {
    this.sendMessage.emit(message);
  }

  protected onDisconnectServerClient(event: { serverId: string; clientId: string }) {
    this.disconnectServerClient.emit(event);
  }
}
