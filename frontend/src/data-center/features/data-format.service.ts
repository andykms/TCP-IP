import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataFormatService {
  private readonly textEncoder = new TextEncoder();

  public stringToHex(str: string) {
    const encoder = this.textEncoder;
    const bytes = encoder.encode(str);

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
      .join('');
  }

  public stringToAscii(str: string) {
    const encoder = this.textEncoder;
    const bytes = encoder.encode(str);
    return String.fromCharCode(...bytes);
  }
}
