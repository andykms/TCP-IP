import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnChanges,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { TcpData, TcpDataType } from '../tcp/features/tcp-data.model';
import { HercTextDirective, THerculesTextType } from '../shared/directives/text.directive';
import { HercToggleButtonDirective } from '../shared/directives/toggle-button.directive';
import { HercBottomSeparatorComponent } from '../shared/util-components/bottom-separator/bottom-separator.component';
import { HercInputDirective } from '../shared/directives/input.directive';
import { HercHintDropdownComponent } from '../shared/ui/hint-dropdown/hint-dropdown.component';
import { HercTableDirective } from '../shared/directives/table.directive';

@Component({
  selector: 'hercules-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    HercTextDirective,
    HercToggleButtonDirective,
    HercBottomSeparatorComponent,
    HercInputDirective,
    HercHintDropdownComponent,
    HercTableDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent implements OnChanges {
  public messages = input<TcpData[]>([]);
  protected form: FormGroup;
  public ips = input<string[]>(['127.0.0.1', '192.168.1.1']);
  public ports = input<number[]>([]);
  public connectionIds = input<string[]>([]);
  protected readonly blockedScroll = signal(false);

  protected filteredMessages = signal<TcpData[]>(this.messages());

  ngOnChanges() {
    this.filter(this.form.value);
    if (this.blockedScroll()) {
      const tableContainerEl = this.el.nativeElement.querySelector('.table-container');
      tableContainerEl.scrollTop = tableContainerEl.scrollHeight;
    }
  }

  constructor(
    private formBuilder: FormBuilder,
    private readonly el: ElementRef,
  ) {
    this.form = this.formBuilder.group({
      sended: [false],
      received: [false],
      errors: [false],
      disconnections: [false],
      ip: [''],
      port: [''],
      connectionId: [''],
      search: [''],
    });
    this.form.valueChanges.subscribe(this.filter.bind(this));
  }

  private filter(value: {
    sended: boolean;
    received: boolean;
    errors: boolean;
    disconnections: boolean;
    ip: string;
    port: string;
    connectionId: string;
    search: string;
  }) {
    const currentMessages = this.messages();
    const resultMessages = [];
    const searchRegex = new RegExp(value.search, 'i');
    for (const message of currentMessages) {
      if (
        (message.host !== value.ip && value.ip.length > 0) ||
        (message.port.toString() !== value.port && value.port.length > 0) ||
        (message.connectionId !== value.connectionId && value.connectionId.length > 0) ||
        (!searchRegex.test(message.data) && value.search.length > 0)
      ) {
        continue;
      }
      if (!(value.sended || value.received || value.errors || value.disconnections)) {
        resultMessages.push(message);
      }
      if (
        (value.sended && message.type === TcpDataType.SEND) ||
        (value.received && message.type === TcpDataType.RECEIVE) ||
        (value.errors && message.type === TcpDataType.ERROR) ||
        (value.disconnections && message.type === TcpDataType.DISCONNECT)
      ) {
        resultMessages.push(message);
      }
    }
    this.filteredMessages.set(resultMessages);
  }

  protected messageType(type: TcpDataType): THerculesTextType {
    switch (type) {
      case TcpDataType.SEND:
        return 'ok';
      case TcpDataType.RECEIVE:
        return 'neutral';
      case TcpDataType.ERROR:
        return 'danger';
      case TcpDataType.DISCONNECT:
        return 'warning';
      default:
        return 'main';
    }
  }

  protected messageTypeText(type: TcpDataType): string {
    switch (type) {
      case TcpDataType.SEND:
        return 'Отправлено';
      case TcpDataType.RECEIVE:
        return 'Получено';
      case TcpDataType.ERROR:
        return 'Ошибка';
      case TcpDataType.DISCONNECT:
        return 'Отключение';
      default:
        return '-';
    }
  }

  protected get portString() {
    return this.ports().map((port) => port.toString());
  }

  protected onScrollMessages(event: Event) {
    event.stopPropagation();

    const scrollY = (event.target as HTMLElement).scrollTop;
    const tableBodyElement = this.el.nativeElement.querySelector('#table-tbody');
    console.log(scrollY, tableBodyElement.scrollHeight);
  }
}
