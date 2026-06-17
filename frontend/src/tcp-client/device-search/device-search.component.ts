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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HercInputDirective } from '../../shared/directives/input.directive';
import { HercButtonDirective, HercButtonType } from '../../shared/directives/button.directive';
import { HercTextDirective } from '../../shared/directives/text.directive';
import { HercTableDirective } from '../../shared/directives/table.directive';
import { HercBorderedContainerDirective } from '../../shared/directives/bordered-container.directive';
import { HercLoaderComponent } from '../../shared/ui/loader/loader.component';
import { DeviceSearchAdapter } from '../../device-search/features/device-search.adapter';
import { type TcpDevice } from '../../device-search/features/tcp-device.model';
import { type ManualSettingData } from '../features/manual-setting-data.model';
import { type TManualSettingStatus } from '../tcp-client-configuration/tcp-client-configuration.component';

@Component({
  selector: 'hercules-device-search',
  templateUrl: './device-search.component.html',
  styleUrls: ['./device-search.component.css'],
  imports: [
    FormsModule,
    HercInputDirective,
    HercButtonDirective,
    HercTextDirective,
    HercTableDirective,
    HercBorderedContainerDirective,
    HercLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceSearchComponent implements OnInit {
  private readonly deviceSearchAdapter = inject(DeviceSearchAdapter);
  private readonly destroyRef = inject(DestroyRef);

  public readonly status = input<TManualSettingStatus>(null);
  public readonly canAddConfiguration = input<boolean>(false);
  protected readonly connect = output<ManualSettingData>();
  protected readonly disconnect = output<void>();
  protected readonly addConfiguration = output<void>();

  protected readonly allDevices = signal<TcpDevice[]>([]);
  protected readonly appliedFilter = signal('');
  protected readonly selectedDevice = signal<TcpDevice | null>(null);
  protected ipFilterValue = '';
  protected readonly isSearching = signal(false);

  protected readonly filteredDevices = computed(() => {
    const filter = this.appliedFilter();
    if (!filter) {
      return this.allDevices();
    }
    return this.allDevices().filter((device) => device.ip.includes(filter));
  });

  protected readonly buttonType = computed<HercButtonType>(() => {
    switch (this.status()) {
      case 'loading':
        return 'tertiary';
      case 'connected':
        return 'ok';
      default:
        return 'primary';
    }
  });

  protected readonly isConnectDisabled = computed(() => {
    return !this.selectedDevice() || this.status() === 'loading' || this.status() === 'connected';
  });

  ngOnInit(): void {
    this.runSearch();
  }

  protected onFind(): void {
    this.appliedFilter.set(this.ipFilterValue.trim());
    this.selectedDevice.set(null);
  }

  protected onRefresh(): void {
    this.runSearch();
  }

  protected onSelectDevice(device: TcpDevice): void {
    if (this.status() === 'connected' || this.status() === 'loading') {
      return;
    }
    this.selectedDevice.set(device);
  }

  protected isSelected(device: TcpDevice): boolean {
    const selected = this.selectedDevice();
    return selected?.ip === device.ip && selected?.port === device.port;
  }

  protected onSubmitConnect(): void {
    const device = this.selectedDevice();
    if (!device) {
      return;
    }

    this.connect.emit({
      ip: device.ip,
      port: device.port.toString(),
    });
  }

  protected onSubmitDisconnect(): void {
    this.disconnect.emit();
  }

  protected onAddConfiguration(): void {
    this.addConfiguration.emit();
  }

  private runSearch(): void {
    this.isSearching.set(true);
    this.selectedDevice.set(null);

    this.deviceSearchAdapter
      .findDevices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (devices) => {
          this.allDevices.set(devices);
          this.isSearching.set(false);
        },
        error: () => {
          this.allDevices.set([]);
          this.isSearching.set(false);
        },
      });
  }
}
