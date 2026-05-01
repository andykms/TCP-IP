import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { HercInputDirective, HercInputType } from '../../shared/directives/input.directive';
import { HercHintDropdownComponent } from '../../shared/ui/hint-dropdown/hint-dropdown.component';
import { HercToggleButtonDirective } from '../../shared/directives/toggle-button.directive';
import { HercTextDirective } from '../../shared/directives/text.directive';
import { HercTextfieldDirective } from '../../shared/directives/textfield.directive';
import { HercButtonDirective, HercButtonType } from '../../shared/directives/button.directive';
import { SendMessage } from '../features/send-message.model';
import { DataFormatService } from '../features/data-format.service';

@Component({
  selector: 'hercules-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    HercInputDirective,
    HercHintDropdownComponent,
    HercToggleButtonDirective,
    HercTextDirective,
    HercTextfieldDirective,
    HercButtonDirective,
  ],
})
export class SendMessageComponent {
  protected form: FormGroup;

  public connections = signal<string[]>([]);
  protected submitSend = output<SendMessage>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      data: ['', Validators.required],
      connectionId: ['', Validators.required],
      format: ['UTF-8', Validators.required],
    });
  }

  protected get dataSizeInBytes() {
    return 0;
  }

  protected onSubmit() {
    if (this.form.valid) {
      this.submitSend.emit(this.form.value);
    }
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

  protected onChooseConnection(connectionId: string) {
    this.form.get('connectionId')?.setValue(connectionId);
  }

  protected get connectionIdType(): HercInputType {
    const field = this.form.get("connectionId");
    const type = field?.valid ? 'base': field?.touched ? 'danger' : 'base';
    return type;
  }

  protected get dataLength() {
    return this.form.get('data')?.value.length;
  }
}
