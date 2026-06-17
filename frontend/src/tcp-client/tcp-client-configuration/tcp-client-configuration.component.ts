import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { TcpService } from '../../tcp/features/tcp.service';
import { ManualSettingComponent } from '../manual-setting/manual-setting.component';
import { DeviceSearchComponent } from '../device-search/device-search.component';
import { SavedConfigurationsComponent } from '../saved-configurations/saved-configurations.component';
import { HercTextDirective, THerculesTextType } from '../../shared/directives/text.directive';
import { HercButtonDirective } from '../../shared/directives/button.directive';
import { ManualSettingData } from '../features/manual-setting-data.model';
import { catchError, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TcpDataType } from '../../tcp/features/tcp-data.model';

export type TManualSettingStatus = 'loading' | 'connected' | 'error' | null;

export enum TcpClientConfigurationTab {
  MANUAL_SETTING = 'manual-setting',
  DEVICE_SEARCH = 'device-search',
  SAVED_CONFIGURATIONS = 'saved-configurations',
}

@Component({
  selector: 'hercules-tcp-client-configuration',
  templateUrl: './tcp-client-configuration.component.html',
  styleUrls: ['./tcp-client-configuration.component.css'],
  imports: [
    ManualSettingComponent,
    DeviceSearchComponent,
    SavedConfigurationsComponent,
    HercTextDirective,
    HercButtonDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TcpClientConfigurationComponent {
  private readonly tcpService = inject(TcpService);
  protected readonly addConfiguration = output<void>();
  protected readonly removeConfiguration = output<void>();
  public readonly canRemoveConfiguration = input<boolean>(false);
  public readonly canAddConfiguration = input<boolean>(false);
  public readonly connectionId = signal<string>('');
  protected readonly activeTab = signal<TcpClientConfigurationTab>(
    TcpClientConfigurationTab.MANUAL_SETTING,
  );
  protected readonly tabs = TcpClientConfigurationTab;
  protected readonly status = signal<TManualSettingStatus>(null);

  constructor(private readonly destroyRef$: DestroyRef) {}

  protected get tcpLabel() {
    return `TCP конфигурация${this.status() === 'connected' ? `, id подключения: ${this.connectionId()}` : ''}`;
  }

  protected tabType(tab: TcpClientConfigurationTab): THerculesTextType {
    return this.activeTab() === tab ? 'primary' : 'main';
  }

  protected setActiveTab(tab: TcpClientConfigurationTab): void {
    this.activeTab.set(tab);
  }

  protected tabClass(tab: TcpClientConfigurationTab): string {
    return this.activeTab() === tab ? 'tab-active' : '';
  }

  protected isDisabledTab(tab: TcpClientConfigurationTab): boolean {
    return tab === this.activeTab()
      ? false
      : this.status() === 'connected' || this.status() === 'loading';
  }

  protected onConnect(data: ManualSettingData) {
    this.status.set('loading');
    this.tcpService
      .connect(data.ip, Number.parseInt(data.port, 10))
      .pipe(
        catchError(() => {
          this.status.set('error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef$),
      )
      .subscribe(({ connectionId, status }) => {
        if (status === TcpDataType.CONNECT) {
          this.status.set('connected');
        }
        if (status === TcpDataType.DISCONNECT) {
          this.status.set(null);
        }
        if (status === TcpDataType.ERROR) {
          this.status.set(null);
        }
        this.connectionId.set(connectionId);
      });
  }

  protected onDisconnect() {
    this.tcpService.disconnect(this.connectionId());
    this.status.set(null);
  }

  protected getClassContent(tab: TcpClientConfigurationTab) {
    return this.activeTab() === tab ? 'content-active' : 'content-inactive';
  }

  protected onAddConfiguration() {
    this.addConfiguration.emit();
  }

  protected onRemoveConfiguration() {
    if (this.status() === 'connected') {
      this.onDisconnect();
    }
    this.removeConfiguration.emit();
  }
}
