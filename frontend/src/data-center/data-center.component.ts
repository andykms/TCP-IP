import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { HercBottomSeparatorComponent } from '../shared/util-components/bottom-separator/bottom-separator.component';
import { TcpData } from '../tcp/features/tcp-data.model';
import { MessagesComponent } from './messages/messages.component';
import { SendMessageComponent } from './send-message/send-message.component';
import { SendMessage } from './features/send-message.model';

enum Tabs {
  Messages = 'Сообщения',
  SendMessage = 'Отправить сообщение',
  SendFile = 'Отправить файл',
}

@Component({
  selector: 'hercules-data-center',
  templateUrl: './data-center.component.html',
  styleUrls: ['./data-center.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HercBottomSeparatorComponent, MessagesComponent, SendMessageComponent],
})
export class DataCenterComponent {
  public messages = input<TcpData[]>([]);
  public ips = input<string[]>(['127.0.0.1', '192.168.1.1']);
  public ports = input<number[]>([]);
  public connectionIds = input<string[]>([]);
  protected sendMessage = output<SendMessage>();

  protected readonly messagesTab = Tabs.Messages;
  protected readonly sendMessageTab = Tabs.SendMessage;
  protected readonly sendFileTab = Tabs.SendFile;

  protected readonly activeTab = signal<string>(Tabs.Messages);

  protected onSetTab(tab: string) {
    this.activeTab.set(tab);
  }

  protected onSendMessage(message: SendMessage) {
    this.sendMessage.emit(message);
  }
}
