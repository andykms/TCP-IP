import {
  Component,
  computed,
  signal,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { TcpClientConfigurationComponent } from './tcp-client-configuration/tcp-client-configuration.component';
import { TcpService } from '../tcp/features/tcp.service';
import { TcpData } from '../tcp/features/tcp-data.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataCenterComponent } from '../data-center/data-center.component';
import { SendMessage } from '../data-center/features/send-message.model';
import { catchError, distinctUntilChanged, EMPTY } from 'rxjs';
import { MessageStatus } from '../data-center/send-message/send-message.component';

@Component({
  selector: 'hercules-tcp-client',
  templateUrl: './tcp-client.component.html',
  styleUrls: ['./tcp-client.component.css'],
  imports: [TcpClientConfigurationComponent, DataCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TcpClientComponent implements OnInit {
  private readonly tcpService = inject(TcpService);
  protected readonly messages = signal<TcpData[]>([]);
  protected readonly ips = signal<string[]>([]);
  protected readonly ports = signal<number[]>([]);
  protected readonly connectionIds = signal<string[]>([]);
  protected readonly configurationsCount = signal(1);
  protected readonly messageStatus = signal<MessageStatus>(null);
  protected readonly configurations = computed(() =>
    Array.from({ length: this.configurationsCount() }, (_, i) => i),
  );

  constructor(private readonly destroyRef$: DestroyRef) {}

  ngOnInit() {
    this.subscribeToTcpService();
  }

  protected onAddConfiguration() {
    this.configurationsCount.update((count) => count + 1);
  }

  protected onRemoveConfiguration() {
    if (this.configurationsCount() > 1) this.configurationsCount.update((count) => count - 1);
  }

  private subscribeToTcpService() {
    this.tcpService
      .getData()
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((newMessage) => this.messages.update((messages) => [...messages, newMessage]));
    this.tcpService.getIp().subscribe((newIp) => this.ips.update((ips) => [...ips, newIp]));
    this.tcpService
      .getPort()
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((newPort) => this.ports.update((ports) => [...ports, newPort]));
    this.tcpService
      .getConnectionId()
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((newConnectionId) =>
        this.connectionIds.update((connectionIds) => [...connectionIds, newConnectionId]),
      );
  }

  protected onSendMessage(message: SendMessage) {
    this.messageStatus.set('pending');
    this.tcpService
      .send(message.connectionId!, message.data, message.format)
      .pipe(
        distinctUntilChanged(),
        catchError(() => {
          this.messageStatus.set('failed');
          return EMPTY;
        }),
      )
      .subscribe(({ success }) => {
        if (success) this.messageStatus.set('sended');
      });
  }
}
