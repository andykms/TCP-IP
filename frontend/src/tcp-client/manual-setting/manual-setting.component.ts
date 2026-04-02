import { Component, computed, input, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HercInputDirective } from '../../shared/directives/input.directive';
import { HercButtonDirective, HercButtonType } from '../../shared/directives/button.directive';
import { HercTextDirective } from '../../shared/directives/text.directive';
import { HerculesDropdownContentComponent } from '../../shared/ui/dropdown-content/dropdown-content.component';
import { type ManualSettingData as TConnectOptions} from '../features/manual-setting-data.model';
import { type TManualSettingStatus } from '../tcp-client-configuration/tcp-client-configuration.component';



@Component({
  selector: 'hercules-manual-setting',
  templateUrl: './manual-setting.component.html',
  styleUrls: ['./manual-setting.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HercInputDirective,
    HercButtonDirective,
    HercTextDirective,
    HerculesDropdownContentComponent
  ],
})
export class ManualSettingComponent {
  public readonly status = input<TManualSettingStatus>(null);
  protected readonly connect = output<TConnectOptions>();
  protected readonly disconnect = output<void>();
  protected readonly addConfiguration = output<void>();

  protected readonly settingForm: FormGroup;
  protected readonly teaAuthForm: FormGroup;
  protected readonly authCodeForm: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {
    this.settingForm = this.formBuilder.group({
      ip: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$'),
        ],
      ],
      port: ['', [Validators.required, Validators.pattern('^[0-9]{1,5}$')]],
    });

    this.teaAuthForm = this.formBuilder.group({
      1: ['', Validators.maxLength(64)],
      2: ['', Validators.maxLength(64)],
      3: ['', Validators.maxLength(64)],
      4: ['', Validators.maxLength(64)],
    });

    this.authCodeForm = this.formBuilder.group({
      authCode: ['', Validators.maxLength(512)],
    });
  }

  protected onSubmitConnect(): void {
    if (this.settingForm.valid) {
      this.connect.emit({...this.settingForm.value, teaAuth: this.teaAuthForm.value, authCode: this.authCodeForm.value});
    }
  }

  protected onSubmitDisconnect(): void {
    this.disconnect.emit();
  }

  protected get isDisabled(): boolean {
    return this.status() === 'loading' || this.status() === 'connected';
  }

  protected buttonType = computed<HercButtonType>(()=> {
    switch (this.status()) {
      case 'loading':
        return 'tertiary';
      case 'connected':
        return 'ok';
      case "error":
        return "primary";
      default:
        return 'primary';
    }
  })

  protected get isButtonDisabled(): boolean {
    return this.settingForm.invalid;
  }

  protected get tcpLabelClasses(): string {
    return this.status() === 'connected' ? 'tcp-label-connected tcp-label' : 'tcp-label';
  }

  protected onAddConfiguration(): void {
    this.addConfiguration.emit();
  }
}
