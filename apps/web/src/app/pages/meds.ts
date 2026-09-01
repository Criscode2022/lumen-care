import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Api, Person } from "../api";
import { Icon } from "../ui/icon";

type Med = {
  id: number;
  name: string;
  dosage: string;
  schedule_times: string;
  with_food: boolean;
  active: boolean;
  person_name: string;
  color: string;
  instructions: string | null;
};

@Component({
  selector: "app-meds",
  standalone: true,
  imports: [FormsModule, Icon],
  template: `
    <main class="main">
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:24px">
        <div>
          <p class="kicker">Regimen</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.4rem);margin-top:6px">Medications</h1>
        </div>
        <button class="btn btn-primary" (click)="open=true"><app-icon name="plus" /> Add</button>
      </header>
      <div class="list">
        @for (m of meds(); track m.id) {
          <article class="row" [class.tone-sage]="m.color==='sage'" [class.tone-clay]="m.color==='clay'" [class.tone-slate]="m.color==='slate'">
            <span class="swatch" style="margin-top:6px"></span>
            <div style="flex:1">
              <strong>{{ m.name }}</strong>
              <p class="muted" style="font-size:.85rem">
                {{ m.person_name }} · {{ m.dosage }} · {{ parseTimes(m.schedule_times).join(' · ') }}
                @if (m.with_food) { · with food }
              </p>
              @if (m.instructions) { <p style="margin-top:4px;font-size:.9rem">{{ m.instructions }}</p> }
            </div>
            @if (!m.active) { <span class="chip chip-mute">Paused</span> }
          </article>
        }
      </div>
      @if (open) {
        <div class="modal-back" (click)="open=false">
          <form class="modal form-grid" (click)="$event.stopPropagation()" (ngSubmit)="save()">
            <h2 class="display" style="font-size:1.5rem">Add a medication</h2>
            <div class="field">
              <label>Person</label>
              <select name="person_id" [(ngModel)]="form.person_id" required>
                @for (p of people(); track p.id) {
                  <option [value]="p.id">{{ p.name }}</option>
                }
              </select>
            </div>
            <div class="field"><label>Name</label><input name="name" [(ngModel)]="form.name" required /></div>
            <div class="field"><label>Dosage</label><input name="dosage" [(ngModel)]="form.dosage" required /></div>
            <div class="field"><label>Times (HH:MM, comma-separated)</label><input name="schedule_times" [(ngModel)]="form.schedule_times" placeholder="08:00, 20:00" required /></div>
            <div class="field"><label>Instructions</label><textarea name="instructions" [(ngModel)]="form.instructions"></textarea></div>
            <label style="display:flex;gap:8px;align-items:center">
              <input type="checkbox" name="with_food" [(ngModel)]="form.with_food" /> With food
            </label>
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
export class Meds implements OnInit {
  private api = inject(Api);
  meds = signal<Med[]>([]);
  people = signal<Person[]>([]);
  open = false;
  form = { person_id: 0, name: "", dosage: "", schedule_times: "08:00", instructions: "", with_food: false };

  async ngOnInit() {
    const [meds, people] = await Promise.all([this.api.get<Med[]>("/medications"), this.api.get<Person[]>("/people")]);
    this.meds.set(meds);
    this.people.set(people);
    if (people[0]) this.form.person_id = people[0].id;
  }

  parseTimes(raw: string) {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  async save() {
    await this.api.post("/medications", {
      ...this.form,
      person_id: Number(this.form.person_id),
      schedule_times: this.form.schedule_times.split(/[, ]+/).filter(Boolean),
    });
    this.open = false;
    this.meds.set(await this.api.get<Med[]>("/medications"));
  }
}
