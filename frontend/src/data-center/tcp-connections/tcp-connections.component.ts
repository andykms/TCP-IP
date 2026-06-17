import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HercButtonDirective } from '../../shared/directives/button.directive';
import { HercTextDirective, type THerculesTextType } from '../../shared/directives/text.directive';
import { HercTableDirective } from '../../shared/directives/table.directive';
import { HercLoaderComponent } from '../../shared/ui/loader/loader.component';
import { TcpService } from '../../tcp/features/tcp.service';
import { type TcpConnectionInfo } from '../features/tcp-connection-info.model';
import { type TcpServerConnectionInfo } from '../features/tcp-server-connection-info.model';
import { HercBorderedContainerDirective } from '../../shared/directives/bordered-container.directive';

export type TcpConnectionsMode = 'client' | 'server';

@Component({
  selector: 'hercules-tcp-connections',
  templateUrl: './tcp-connections.component.html',
  styleUrls: ['./tcp-connections.component.css'],
  imports: [
    HercButtonDirective,
    HercTextDirective,
    HercTableDirective,
    HercLoaderComponent,
    HercBorderedContainerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TcpConnectionsComponent implements OnInit {
  private readonly tcpService = inject(TcpService);
  private readonly destroyRef = inject(DestroyRef);

  public mode = input<TcpConnectionsMode>('client');
  public serverConnections = input<TcpServerConnectionInfo[]>([]);

  protected readonly disconnect = output<string>();
  protected readonly disconnectServerClient = output<{
    serverId: string;
    clientId: string;
  }>();

  protected readonly connections = signal<TcpConnectionInfo[]>([]);
  protected readonly isLoading = signal(false);

  ngOnInit(): void {
    if (this.mode() === 'client') {
      this.loadConnections();
    }
  }

  protected onRefresh(): void {
    this.loadConnections();
  }

  protected onDisconnect(connectionId: string): void {
    if (this.mode() === 'server') {
      const connection = this.serverConnections().find(
        (item) => item.connectionId === connectionId,
      );
      if (!connection) {
        return;
      }

      this.disconnectServerClient.emit({
        serverId: connection.serverId,
        clientId: connection.clientId,
      });
      return;
    }

    this.tcpService
      .disconnect(connectionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.connections.update((list) =>
          list.filter((connection) => connection.connectionId !== connectionId),
        );
      });
  }

  protected statusLabel(status: TcpServerConnectionInfo['status']): string {
    return status === 'connected' ? 'Подключен' : 'Отключен';
  }

  protected statusTextType(status: TcpServerConnectionInfo['status']): THerculesTextType {
    return status === 'connected' ? 'ok' : 'warning';
  }

  private loadConnections(): void {
    this.isLoading.set(true);

    this.tcpService
      .getConnections()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (connections) => {
          this.connections.set(connections);
          this.isLoading.set(false);
        },
        error: () => {
          this.connections.set([]);
          this.isLoading.set(false);
        },
      });
  }
}
