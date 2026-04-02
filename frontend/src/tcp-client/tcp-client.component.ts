import { Component, computed, signal } from "@angular/core";
import { TcpClientConfigurationComponent } from "./tcp-client-configuration/tcp-client-configuration.component";

@Component({
  selector: "hercules-tcp-client",
  templateUrl: "./tcp-client.component.html",
  styleUrls: ["./tcp-client.component.css"],
  imports: [TcpClientConfigurationComponent],
})
export class TcpClientComponent {
  protected readonly configurationsCount = signal(1);
  protected readonly configurations = computed(() => Array.from({length: this.configurationsCount()}, (_, i) => i));


  protected onAddConfiguration() {
    this.configurationsCount.update(count => count + 1);
  }

  protected onRemoveConfiguration() {
    if(this.configurationsCount() > 1) this.configurationsCount.update(count => count - 1);
  }
}