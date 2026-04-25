import { ChangeDetectionStrategy, Component, OnInit, output, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { HercInputDirective } from '../../shared/directives/input.directive';
import { HercHintDropdownComponent } from '../../shared/ui/hint-dropdown/hint-dropdown.component';
import { HercToggleButtonDirective } from '../../shared/directives/toggle-button.directive';
import { HercTextDirective } from '../../shared/directives/text.directive';
import { HercTextfieldDirective } from '../../shared/directives/textfield.directive';
import { MessageFormat } from '../../tcp/features/message-format.model';
import { HercButtonDirective, HercButtonType } from '../../shared/directives/button.directive';

type SendMessage = {
  connectionId: string;
  data: string;
  format: MessageFormat;
};

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
  protected submit = output<SendMessage>();

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
      this.submit.emit(this.form.value);
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
}
