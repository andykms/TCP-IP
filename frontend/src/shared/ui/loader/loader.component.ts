import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'hercules-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HercLoaderComponent {}
