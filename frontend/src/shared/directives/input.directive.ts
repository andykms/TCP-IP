import { Directive, effect, ElementRef, input, OnInit, Renderer2 } from "@angular/core";

@Directive({
  selector: "[herculesInputContainer]",
  host: {
    "(change)": "onChange($event)"
  }
})
export class HercInputDirective implements OnInit {

  public readonly size = input<"small" | "medium" | "large">("medium");
  public readonly disabled = input<boolean>(false);

  private readonly disabledEffect = effect(() => {
    const inputElem = this.el.nativeElement.querySelector("input");
    inputElem.color = this.disabled() ? "var(--disabled-color)" : "var(--main-text-color)";
  });

  ngOnInit() {
    this.setClasses();
  }

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  private setClasses() {
    const classes = [];
    classes.push("hercules-input-container");

    switch(this.size()){
      case "small":
        classes.push("hercules-input-small");
        break;
      case "medium":
        classes.push("hercules-input-medium");
        break;
      case "large":
        classes.push("hercules-input-large");
        break;
    }
    this.renderer.setAttribute(this.el.nativeElement, "class", classes.join(" "));
  }

  onChange(event: Event) {
    if(this.disabled()) {
      event.preventDefault();
    }
  }
}