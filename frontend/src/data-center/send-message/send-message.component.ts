import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnChanges,
  output,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { HercInputDirective, HercInputType } from '../../shared/directives/input.directive';
import { HercListDropdownComponent } from '../../shared/ui/list-dropdown/list-dropdown.component';
import { HercToggleButtonDirective } from '../../shared/directives/toggle-button.directive';
import { HercTextDirective } from '../../shared/directives/text.directive';
import { HercTextfieldDirective } from '../../shared/directives/textfield.directive';
import { HercButtonDirective } from '../../shared/directives/button.directive';
import { SendMessage } from '../features/send-message.model';
import { DataFormatService } from '../features/data-format.service';
import { HercLoaderComponent } from '../../shared/ui/loader/loader.component';
import { type TcpConnectionInfo } from '../features/tcp-connection-info.model';
import { type DropdownListItem } from '../../shared/features/dropdown-list-item.model';

export type MessageStatus = 'failed' | 'sended' | 'pending' | null;
export type SendMessageMode = 'client' | 'server';

@Component({
  selector: 'hercules-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    HercInputDirective,
    HercListDropdownComponent,
    HercToggleButtonDirective,
    HercTextDirective,
    HercTextfieldDirective,
    HercButtonDirective,
    HercLoaderComponent,
  ],
})
export class SendMessageComponent implements OnChanges {
  protected form: FormGroup;
  private readonly dataFormatService = inject(DataFormatService);

  public mode = input<SendMessageMode>('client');
  public connections = input<TcpConnectionInfo[]>([]);
  protected submitSend = output<SendMessage>();
  public messageStatus = input<MessageStatus>(null);

  protected readonly connectionOptions = computed<DropdownListItem[]>(() =>
    this.connections().map((connection, index) => ({
      id: index,
      label: `${connection.connectionId} (${connection.ip} ${connection.port})`,
    })),
  );

  private readonly modeEffect = effect(() => {
    const connectionIdControl = this.form.get('connectionId');
    if (!connectionIdControl) {
      return;
    }

    if (this.mode() === 'server') {
      connectionIdControl.clearValidators();
      connectionIdControl.setValue('');
    } else {
      connectionIdControl.setValidators(Validators.required);
    }

    connectionIdControl.updateValueAndValidity();
  });

  ngOnChanges() {
    switch (this.messageStatus()) {
      case null:
        break;
      case 'failed':
        break;
      case 'sended':
        if (this.mode() === 'server') {
          this.form.patchValue({ data: '', format: 'UTF-8' });
        } else {
          this.form.setValue({
            data: '',
            connectionId: '',
            format: 'UTF-8',
          });
        }
        break;
      case 'pending':
        break;
    }
  }

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      data: ['', Validators.required],
      connectionId: ['', Validators.required],
      format: ['UTF-8', Validators.required],
    });
  }

  protected onSubmit() {
    if (!this.form.valid) {
      return;
    }

    if (this.mode() === 'server') {
      this.submitSend.emit({
        data: this.form.value.data,
        format: this.form.value.format,
      });
      return;
    }

    this.submitSend.emit(this.form.value);
  }

  protected get isToggleHexActive() {
    return this.form.get('format')?.value == 'HEX';
  }

  protected onClickSetHex() {
    this.form.get('format')?.setValue(this.form.get('format')?.value == 'HEX' ? 'UTF-8' : 'HEX');
  }

  protected get isToggleAsciiActive() {
    return this.form.get('format')?.value == 'ASCII';
  }

  protected onClickSetAscii() {
    this.form
      .get('format')
      ?.setValue(this.form.get('format')?.value == 'ASCII' ? 'UTF-8' : 'ASCII');
  }

  protected get connectionIdValue() {
    return this.form.get('connectionId')?.value;
  }

  protected onChooseConnection(option: DropdownListItem) {
    const connection = this.connections()[option.id];
    if (!connection) {
      return;
    }

    this.form.get('connectionId')?.setValue(connection.connectionId);
  }

  protected get connectionIdType(): HercInputType {
    const field = this.form.get('connectionId');
    const type = field?.valid ? 'base' : field?.touched ? 'danger' : 'base';
    return type;
  }

  protected get dataLength() {
    return this.form.get('data')?.value.length;
  }

  protected get isChoosenFormatHex() {
    return this.form.get('format')?.value == 'HEX';
  }

  protected get isChoosenFormatAscii() {
    return this.form.get('format')?.value == 'ASCII';
  }

  protected get dataHex() {
    return this.dataFormatService.stringToHex(this.form.get('data')?.value);
  }

  protected get dataAscii() {
    return this.dataFormatService.stringToAscii(this.form.get('data')?.value);
  }
}
