import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Api, fmtDob, fmtTime, pct, Person } from "../api";

@Component({
  selector: "app-person",
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="main">
      @if (detail(); as d) {
        <p style="margin-bottom:12px"><a routerLink="/app/people" class="muted">People</a></p>
        <header style="margin-bottom:24px">
          <p class="kicker">{{ d.person.relationship || 'In care' }}</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.6rem);margin-top:6px">{{ d.person.preferred_name || d.person.name }}</h1>
          <p class="muted">{{ d.person.name }} @if (d.person.date_of_birth) { · {{ fmtDob(d.person.date_of_birth) }} }</p>
        </header>
        <section class="grid-stats" style="margin-bottom:20px">
          <article class="card">
            <p class="subtle" style="font-size:.75rem">Adherence · 7d</p>
            <p class="display tabular" style="font-size:2rem">{{ pct(d.adherence7d.taken, d.adherence7d.total) }}%</p>
          </article>
          <article class="card">
            <p class="subtle" style="font-size:.75rem">Medications</p>
            <p class="display tabular" style="font-size:2rem">{{ d.medications.length }}</p>
          </article>
          <article class="card">
            <p class="subtle" style="font-size:.75rem">Emergency</p>
            <p style="margin-top:8px;font-weight:500">{{ d.person.emergency_name || '—' }}</p>
            <p class="muted">{{ d.person.emergency_phone }}</p>
          </article>
        </section>
        <article class="card" style="margin-bottom:16px">
          <h2 style="font-weight:600;margin-bottom:8px">Clinical notes</h2>
          <p><span class="muted">Conditions.</span> {{ d.person.conditions || 'None recorded' }}</p>
          <p style="margin-top:8px"><span class="muted">Allergies.</span> {{ d.person.allergies || 'None recorded' }}</p>
          @if (d.person.notes) { <p style="margin-top:8px">{{ d.person.notes }}</p> }
        </article>
        <article class="card" style="margin-bottom:16px">
          <h2 style="font-weight:600;margin-bottom:12px">Medications</h2>
          <div class="list">
            @for (m of d.medications; track m.id) {
              <div class="row">
                <div>
                  <strong>{{ m.name }}</strong>
                  <div class="muted" style="font-size:.85rem">{{ m.dosage }} · {{ parseTimes(m.schedule_times).join(', ') }}</div>
                </div>
              </div>
            }
          </div>
        </article>
        <article class="card">
          <h2 style="font-weight:600;margin-bottom:12px">Recent journal</h2>
          <div class="list">
            @for (j of d.journal; track j.id) {
              <div class="row">
                <span class="chip chip-mute">{{ j.kind }}</span>
                <div>
                  <p>{{ j.body }}</p>
                  <p class="muted" style="font-size:.8rem">{{ fmtTime(j.recorded_at) }}</p>
                </div>
              </div>
            }
          </div>
        </article>
      }
    </main>
  `,
})
export class PersonPage implements OnInit {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  detail = signal<{
    person: Person;
    medications: Array<{ id: number; name: string; dosage: string; schedule_times: string }>;
    journal: Array<{ id: number; kind: string; body: string; recorded_at: string }>;
    adherence7d: { taken: number; total: number };
  } | null>(null);
  fmtDob = fmtDob;
  fmtTime = fmtTime;
  pct = pct;

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.detail.set(await this.api.get(`/people/${id}`));
  }

  parseTimes(raw: string) {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
}
