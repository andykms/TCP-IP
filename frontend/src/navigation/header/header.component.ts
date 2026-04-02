import { Component, inject, signal } from "@angular/core";
import { HercTextDirective } from "../../shared/directives/text.directive";
import { ActivatedRoute, RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "hercules-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
  imports: [HercTextDirective, RouterLink, RouterLinkActive],
})
export class HeaderComponent {
  protected readonly activeRoute = signal("tcp-client");
}