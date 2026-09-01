import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { Icon } from "./icon";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <div class="shell">
      <aside class="side">
        <a routerLink="/app" class="flex items-center gap-3" style="display:flex;align-items:center;gap:12px">
          <span class="mark"><app-icon name="mark" /></span>
          <span>
            <strong class="display" style="font-size:1.25rem">Lumen</strong>
            <div class="subtle" style="font-size:0.75rem">Care board</div>
          </span>
        </a>
        <nav style="display:flex;flex-direction:column;gap:4px">
          @for (item of items; track item.path) {
            <a class="nav-link" [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }">
              <app-icon [name]="item.icon" />
              {{ item.label }}
            </a>
          }
        </nav>
        <p class="subtle" style="margin-top:auto;font-size:0.75rem;padding:0 8px">
          Shared demo circle. Fictional family — try the board, then make it yours.
        </p>
      </aside>
      <div>
        <router-outlet />
      </div>
      <nav class="dock" aria-label="Primary">
        @for (item of dock; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }">
            <app-icon [name]="item.icon" />
            {{ item.short }}
          </a>
        }
      </nav>
    </div>
  `,
})
export class Shell {
  items = [
    { path: "/app", label: "Today", icon: "home", exact: true },
    { path: "/app/people", label: "People", icon: "people", exact: false },
    { path: "/app/meds", label: "Medications", icon: "pill", exact: false },
    { path: "/app/calendar", label: "Calendar", icon: "calendar", exact: false },
    { path: "/app/tasks", label: "Tasks", icon: "check", exact: false },
    { path: "/app/journal", label: "Journal", icon: "book", exact: false },
    { path: "/app/team", label: "Circle", icon: "users", exact: false },
  ];
  dock = [
    { path: "/app", label: "Today", short: "Today", icon: "home", exact: true },
    { path: "/app/people", label: "People", short: "People", icon: "people", exact: false },
    { path: "/app/meds", label: "Meds", short: "Meds", icon: "pill", exact: false },
    { path: "/app/calendar", label: "Calendar", short: "Dates", icon: "calendar", exact: false },
    { path: "/app/tasks", label: "Tasks", short: "Tasks", icon: "check", exact: false },
  ];
}
