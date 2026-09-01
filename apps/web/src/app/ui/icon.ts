import { Component, Input, inject } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

const PATHS: Record<string, string> = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h4.5v-5h3V20H18v-9.5"/>',
  people: '<circle cx="9" cy="8" r="2.6"/><circle cx="16" cy="9" r="2.2"/><path d="M4.5 19c.6-3 2.6-4.6 4.6-4.6s4 1.6 4.6 4.6"/><path d="M13.5 19c.3-1.8 1.4-3 2.6-3 1.4 0 2.5 1.1 2.9 3"/>',
  pill: '<rect x="4.5" y="9" width="15" height="6" rx="3" transform="rotate(-28 12 12)"/><path d="M10 8.2 14.2 15.6"/>',
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 10h16"/>',
  check: '<path d="M5 13.5 9.2 18 19 7"/>',
  book: '<path d="M5 5.5c2.2-1 4.4-.7 7 .8 2.6-1.5 4.8-1.8 7-.8v13c-2.2-1-4.4-.7-7 .8-2.6-1.5-4.8-1.8-7-.8z"/><path d="M12 6.4V19"/>',
  users: '<circle cx="12" cy="8" r="2.6"/><path d="M6 19c.7-3.2 2.9-5 6-5s5.3 1.8 6 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M7 7l10 10M17 7 7 17"/>',
  alert: '<path d="M12 4 3.6 19h16.8L12 4z"/><path d="M12 9v5M12 16.5v.5"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.5"/>',
  mark: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
};

@Component({
  selector: "app-icon",
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [innerHTML]="safe"
    ></svg>
  `,
})
export class Icon {
  private sanitizer = inject(DomSanitizer);
  @Input() name = "mark";
  get safe() {
    return this.sanitizer.bypassSecurityTrustHtml(PATHS[this.name] ?? PATHS["mark"]);
  }
}
