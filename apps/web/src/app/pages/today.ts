import { Component, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Api, Dashboard, Dose, fmtTime, pct } from "../api";
import { Icon } from "../ui/icon";

@Component({
  selector: "app-today",
  standalone: true,
  imports: [RouterLink, Icon],
  template: `
    <main class="main">
      <header style="display:flex;justify-content:space-between;gap:16px;align-items:flex-end;flex-wrap:wrap;margin-bottom:28px">
        <div>
          <p class="kicker">{{ greeting }}</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.6rem);margin-top:6px">Today’s board</h1>
        </div>
        @if (data(); as d) {
          <p class="muted tabular">{{ d.people.length }} in care</p>
        }
      </header>

      @if (error()) {
        <p class="chip chip-danger">{{ error() }}</p>
      } @else if (!data()) {
        <p class="muted">Loading the circle…</p>
      } @else {
        @let d = data()!;
        <section class="grid-stats" style="margin-bottom:20px">
          <article class="card">
            <p class="subtle" style="font-size:.75rem;font-weight:500">Adherence · 7 days</p>
            <p class="display tabular" style="font-size:2rem;margin:8px 0">{{ pct(d.adherence7d.taken, d.adherence7d.total) }}%</p>
            <div class="progress"><span [style.width.%]="pct(d.adherence7d.taken, d.adherence7d.total)"></span></div>
            <p class="muted" style="margin-top:8px;font-size:.85rem">{{ d.adherence7d.taken }} of {{ d.adherence7d.total }} doses taken</p>
          </article>
          <article class="card">
            <p class="subtle" style="font-size:.75rem;font-weight:500">Still open today</p>
            <p class="display tabular" style="font-size:2rem;margin:8px 0">{{ pendingCount(d) }}</p>
            <p class="muted" style="font-size:.85rem">doses waiting on a tap</p>
          </article>
          <article class="card">
            <p class="subtle" style="font-size:.75rem;font-weight:500">Ahead</p>
            <p class="display tabular" style="font-size:2rem;margin:8px 0">{{ d.upcomingAppointments.length }}</p>
            <p class="muted" style="font-size:.85rem">upcoming visits on the calendar</p>
          </article>
        </section>

        @if (d.alerts.length) {
          <section class="card" style="margin-bottom:20px">
            <h2 style="font-weight:600;margin-bottom:12px">Needs a look</h2>
            <div class="list">
              @for (a of d.alerts; track a.title) {
                <a class="row" [routerLink]="a.href">
                  <app-icon name="alert" />
                  <span style="flex:1">
                    <strong>{{ a.title }}</strong>
                    <div class="muted" style="font-size:.85rem">{{ a.detail }}</div>
                  </span>
                </a>
              }
            </div>
          </section>
        }

        <section class="card" style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
            <h2 style="font-weight:600">Doses</h2>
            <a class="muted" routerLink="/app/meds" style="font-size:.85rem">All medications</a>
          </div>
          <div class="list">
            @for (dose of d.todayDoses; track dose.id) {
              <div class="row" [class.tone-sage]="dose.color==='sage'" [class.tone-clay]="dose.color==='clay'" [class.tone-slate]="dose.color==='slate'">
                <span class="swatch" style="margin-top:6px"></span>
                <div style="flex:1">
                  <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
                    <strong>{{ dose.medication_name }}</strong>
                    <span class="tabular muted">{{ fmtTime(dose.scheduled_for) }}</span>
                  </div>
                  <p class="muted" style="font-size:.85rem">
                    {{ dose.preferred_name || dose.person_name }} · {{ dose.dosage }}
                    @if (dose.with_food) { · with food }
                  </p>
                </div>
                @if (dose.status === 'taken') {
                  <span class="chip">Taken</span>
                } @else if (dose.status === 'skipped') {
                  <span class="chip chip-warn">Skipped</span>
                } @else {
                  <span style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="btn btn-primary" style="min-height:40px" (click)="log(dose, 'taken')">Taken</button>
                    <button class="btn btn-ghost" style="min-height:40px" (click)="log(dose, 'skipped')">Skip</button>
                  </span>
                }
              </div>
            }
          </div>
        </section>

        <div style="display:grid;gap:16px">
          <section class="card">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <h2 style="font-weight:600">Coming up</h2>
              <a class="muted" routerLink="/app/calendar" style="font-size:.85rem">Calendar</a>
            </div>
            <div class="list">
              @for (a of d.upcomingAppointments; track $index) {
                <div class="row">
                  <app-icon name="calendar" />
                  <div>
                    <strong>{{ a['title'] }}</strong>
                    <div class="muted" style="font-size:.85rem">
                      {{ a['person_name'] }} · {{ fmtTime(a['starts_at']) }} · {{ a['location'] }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
          <section class="card">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <h2 style="font-weight:600">Open work</h2>
              <a class="muted" routerLink="/app/tasks" style="font-size:.85rem">Tasks</a>
            </div>
            <div class="list">
              @for (t of d.openTasks; track $index) {
                <div class="row">
                  <span class="chip" [class.chip-warn]="t['priority']==='high'">{{ t['priority'] }}</span>
                  <div>
                    <strong>{{ t['title'] }}</strong>
                    <div class="muted" style="font-size:.85rem">{{ t['person_name'] || 'Household' }} @if (t['due_on']) { · due {{ t['due_on'] }} }</div>
                  </div>
                </div>
              }
            </div>
          </section>
        </div>
      }
    </main>
  `,
})
export class Today implements OnInit {
  private api = inject(Api);
  data = signal<Dashboard | null>(null);
  error = signal("");
  greeting = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  pct = pct;
  fmtTime = fmtTime;

  ngOnInit() {
    this.reload();
  }

  pendingCount(d: Dashboard) {
    return d.todayDoses.filter((x) => x.status === "pending").length;
  }

  async reload() {
    try {
      this.data.set(await this.api.get<Dashboard>("/dashboard"));
      this.error.set("");
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : "Could not load the board");
    }
  }

  async log(dose: Dose, status: "taken" | "skipped") {
    await this.api.post(`/medications/${dose.medication_id}/doses`, {
      status,
      scheduled_for: dose.scheduled_for,
    });
    await this.reload();
  }
}
