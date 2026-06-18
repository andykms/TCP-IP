import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HercInputDirective } from '../../shared/directives/input.directive';
import { HercButtonDirective, HercButtonType } from '../../shared/directives/button.directive';
import { HercTextDirective, type THerculesTextType } from '../../shared/directives/text.directive';
import { HercTableDirective } from '../../shared/directives/table.directive';
import { HercBorderedContainerDirective } from '../../shared/directives/bordered-container.directive';
import { HercLoaderComponent } from '../../shared/ui/loader/loader.component';
import { type TcpServerClient, type TcpServerStatus } from '../features/tcp-server-client.model';

@Component({
  selector: 'hercules-server-setting',
  templateUrl: './server-setting.component.html',
  styleUrls: ['./server-setting.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HercInputDirective,
    HercButtonDirective,
    HercTextDirective,
    HercTableDirective,
    HercBorderedContainerDirective,
    HercLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerSettingComponent {
  public readonly status = input<TcpServerStatus>(null);
  public readonly clients = input<TcpServerClient[]>([]);
  public readonly canAddServer = input<boolean>(false);
  public readonly canRemoveServer = input<boolean>(false);

  protected readonly open = output<number>();
  protected readonly close = output<void>();
  protected readonly addServer = output<void>();
  protected readonly removeServer = output<void>();
  protected readonly disconnectClient = output<string>();

  protected readonly settingForm: FormGroup;
  protected searchValue = '';
  protected readonly appliedFilter = signal('');

  protected readonly filteredClients = computed(() => {
    const filter = this.appliedFilter().toLowerCase();
    if (!filter) {
      return this.clients();
    }

    return this.clients().filter((client) =>
      [
        client.ip,
        client.port.toString(),
        this.formatDate(client.connectedAt),
        client.bytesReceived.toString(),
        this.statusLabel(client.status),
      ].some((value) => value.toLowerCase().includes(filter)),
    );
  });

  protected readonly buttonType = computed<HercButtonType>(() => {
    switch (this.status()) {
      case 'loading':
        return 'tertiary';
      case 'opened':
        return 'ok';
      default:
        return 'primary';
    }
  });

  constructor(private readonly formBuilder: FormBuilder) {
    this.settingForm = this.formBuilder.group({
      port: ['', [Validators.required, Validators.pattern('^[0-9]{1,5}$')]],
    });
  }

  protected get isDisabled(): boolean {
    return this.status() === 'loading' || this.status() === 'opened';
  }

  protected get isButtonDisabled(): boolean {
    return this.settingForm.invalid;
  }

  protected get tcpLabelClasses(): string {
    return this.status() === 'opened' ? 'tcp-label-opened tcp-label' : 'tcp-label';
  }

  protected get tcpLabel(): string {
    const port = this.settingForm.get('port')?.value;
    return `TCP конфигурация${this.status() === 'opened' && port ? `, порт: ${port}` : ''}`;
  }

  protected onSubmitOpen(): void {
    if (this.settingForm.valid) {
      this.open.emit(Number.parseInt(this.settingForm.value.port, 10));
    }
  }

  protected onSubmitClose(): void {
    this.close.emit();
  }

  protected onAddServer(): void {
    this.addServer.emit();
  }

  protected onRemoveServer(): void {
    if (this.status() === 'opened') {
      this.close.emit();
    }
    this.removeServer.emit();
  }

  protected onFind(): void {
    this.appliedFilter.set(this.searchValue.trim());
  }

  protected onDisconnectClient(clientId: string): void {
    this.disconnectClient.emit(clientId);
  }

  protected statusLabel(status: TcpServerClient['status']): string {
    return status === 'connected' ? 'Подключен' : 'Отключен';
  }

  protected statusTextType(status: TcpServerClient['status']): THerculesTextType {
    return status === 'connected' ? 'ok' : 'warning';
  }

  protected formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }
}
