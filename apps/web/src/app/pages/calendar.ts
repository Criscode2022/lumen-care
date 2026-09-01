import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Api, fmtDate, fmtTime, Person } from "../api";
import { Icon } from "../ui/icon";

type Visit = {
  id: number;
  title: string;
  starts_at: string;
  person_name: string;
  color: string;
  kind: string;
  location: string | null;
  provider: string | null;
  notes: string | null;
};

@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [FormsModule, Icon],
  template: `
    <main class="main">
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:24px">
        <div>
          <p class="kicker">Visits</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.4rem);margin-top:6px">Calendar</h1>
        </div>
        <button class="btn btn-primary" (click)="open=true"><app-icon name="plus" /> Add</button>
      </header>
      <div class="list">
        @for (a of items(); track a.id) {
          <article class="row" [class.tone-sage]="a.color==='sage'" [class.tone-clay]="a.color==='clay'" [class.tone-slate]="a.color==='slate'">
            <span class="swatch" style="margin-top:6px"></span>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <strong>{{ a.title }}</strong>
                <span class="muted tabular">{{ fmtDate(a.starts_at) }} · {{ fmtTime(a.starts_at) }}</span>
              </div>
              <p class="muted" style="font-size:.85rem">
                {{ a.person_name }} · {{ a.kind }} @if (a.location) { · {{ a.location }} } @if (a.provider) { · {{ a.provider }} }
              </p>
              @if (a.notes) { <p style="margin-top:4px;font-size:.9rem">{{ a.notes }}</p> }
            </div>
            <button class="btn btn-ghost btn-icon" (click)="remove(a.id)" aria-label="Remove"><app-icon name="close" /></button>
          </article>
        }
      </div>
      @if (open) {
        <div class="modal-back" (click)="open=false">
          <form class="modal form-grid" (click)="$event.stopPropagation()" (ngSubmit)="save()">
            <h2 class="display" style="font-size:1.5rem">Add a visit</h2>
            <div class="field">
              <label>Person</label>
              <select name="person_id" [(ngModel)]="form.person_id">
                @for (p of people(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div class="field"><label>Title</label><input name="title" [(ngModel)]="form.title" required /></div>
            <div class="form-grid form-grid-2">
              <div class="field">
                <label>Kind</label>
                <select name="kind" [(ngModel)]="form.kind">
                  <option value="clinic">Clinic</option>
                  <option value="therapy">Therapy</option>
                  <option value="lab">Lab</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="field"><label>Starts</label><input type="datetime-local" name="starts_at" [(ngModel)]="form.starts_at" required /></div>
            </div>
            <div class="field"><label>Location</label><input name="location" [(ngModel)]="form.location" /></div>
            <div class="field"><label>Provider</label><input name="provider" [(ngModel)]="form.provider" /></div>
            <div class="field"><label>Notes</label><textarea name="notes" [(ngModel)]="form.notes"></textarea></div>
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
export class CalendarPage implements OnInit {
  private api = inject(Api);
  items = signal<Visit[]>([]);
  people = signal<Person[]>([]);
  open = false;
  fmtDate = fmtDate;
  fmtTime = fmtTime;
  form = { person_id: 0, title: "", kind: "clinic", starts_at: "", location: "", provider: "", notes: "" };

  async ngOnInit() {
    this.people.set(await this.api.get<Person[]>("/people"));
    if (this.people()[0]) this.form.person_id = this.people()[0].id;
    await this.reload();
  }
  async reload() {
    this.items.set(await this.api.get<Visit[]>("/appointments"));
  }
  async save() {
    await this.api.post("/appointments", {
      ...this.form,
      person_id: Number(this.form.person_id),
      starts_at: new Date(this.form.starts_at).toISOString(),
    });
    this.open = false;
    await this.reload();
  }
  async remove(id: number) {
    await this.api.delete(`/appointments/${id}`);
    await this.reload();
  }
}
