import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Api, fmtDate, fmtTime, Person } from "../api";
import { Icon } from "../ui/icon";

type Entry = {
  id: number;
  kind: string;
  body: string;
  recorded_at: string;
  person_name: string;
  color: string;
};

@Component({
  selector: "app-journal",
  standalone: true,
  imports: [FormsModule, Icon],
  template: `
    <main class="main">
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:24px">
        <div>
          <p class="kicker">Notes for the circle</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.4rem);margin-top:6px">Journal</h1>
        </div>
        <button class="btn btn-primary" (click)="open=true"><app-icon name="plus" /> Entry</button>
      </header>
      <div class="list">
        @for (j of items(); track j.id) {
          <article class="row" [class.tone-sage]="j.color==='sage'" [class.tone-clay]="j.color==='clay'" [class.tone-slate]="j.color==='slate'">
            <span class="swatch" style="margin-top:8px"></span>
            <div style="flex:1">
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <span class="chip chip-mute">{{ j.kind }}</span>
                <span class="muted" style="font-size:.85rem">{{ j.person_name }} · {{ fmtDate(j.recorded_at) }} {{ fmtTime(j.recorded_at) }}</span>
              </div>
              <p style="margin-top:8px">{{ j.body }}</p>
            </div>
          </article>
        }
      </div>
      @if (open) {
        <div class="modal-back" (click)="open=false">
          <form class="modal form-grid" (click)="$event.stopPropagation()" (ngSubmit)="save()">
            <h2 class="display" style="font-size:1.5rem">New entry</h2>
            <div class="field">
              <label>Person</label>
              <select name="person_id" [(ngModel)]="form.person_id">
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div class="field">
              <label>Kind</label>
              <select name="kind" [(ngModel)]="form.kind">
                <option value="note">Note</option>
                <option value="symptom">Symptom</option>
                <option value="mood">Mood</option>
                <option value="question">Question for the clinician</option>
                <option value="win">Win</option>
              </select>
            </div>
            <div class="field"><label>What happened</label><textarea name="body" [(ngModel)]="form.body" required></textarea></div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button type="button" class="btn btn-ghost" (click)="open=false">Cancel</button>
              <button class="btn btn-primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      }
    </main>
  `,
})
export class Journal implements OnInit {
  private api = inject(Api);
  items = signal<Entry[]>([]);
  people = signal<Person[]>([]);
  open = false;
  fmtDate = fmtDate;
  fmtTime = fmtTime;
  form = { person_id: 0, kind: "note", body: "" };

  async ngOnInit() {
    this.people.set(await this.api.get<Person[]>("/people"));
    if (this.people()[0]) this.form.person_id = this.people()[0].id;
    this.items.set(await this.api.get<Entry[]>("/journal"));
  }
  async save() {
    await this.api.post("/journal", { ...this.form, person_id: Number(this.form.person_id) });
    this.open = false;
    this.form.body = "";
    this.items.set(await this.api.get<Entry[]>("/journal"));
  }
}
