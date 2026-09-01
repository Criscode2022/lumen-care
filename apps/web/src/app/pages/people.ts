import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Api, Person, fmtDob } from "../api";
import { Icon } from "../ui/icon";

@Component({
  selector: "app-people",
  standalone: true,
  imports: [RouterLink, FormsModule, Icon],
  template: `
    <main class="main">
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:24px">
        <div>
          <p class="kicker">The household</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.4rem);margin-top:6px">People in care</h1>
        </div>
        <button class="btn btn-primary" (click)="open = true"><app-icon name="plus" /> Add</button>
      </header>
      <div class="list">
        @for (p of people(); track p.id) {
          <a class="row" [routerLink]="['/app/people', p.id]" [class.tone-sage]="p.color==='sage'" [class.tone-clay]="p.color==='clay'" [class.tone-slate]="p.color==='slate'">
            <span class="swatch" style="margin-top:6px"></span>
            <div style="flex:1">
              <strong>{{ p.preferred_name || p.name }}</strong>
              <div class="muted" style="font-size:.85rem">{{ p.relationship || 'In the circle' }} @if (p.date_of_birth) { · {{ fmtDob(p.date_of_birth) }} }</div>
            </div>
            <app-icon name="chevron" />
          </a>
        }
      </div>
      @if (open) {
        <div class="modal-back" (click)="open=false">
          <form class="modal form-grid" (click)="$event.stopPropagation()" (ngSubmit)="save()">
            <h2 class="display" style="font-size:1.5rem">Add a person</h2>
            <div class="field"><label>Full name</label><input name="name" [(ngModel)]="form.name" required /></div>
            <div class="form-grid form-grid-2">
              <div class="field"><label>Preferred name</label><input name="preferred_name" [(ngModel)]="form.preferred_name" /></div>
              <div class="field"><label>Relationship</label><input name="relationship" [(ngModel)]="form.relationship" placeholder="Mother, son, client" /></div>
            </div>
            <div class="form-grid form-grid-2">
              <div class="field"><label>Date of birth</label><input type="date" name="date_of_birth" [(ngModel)]="form.date_of_birth" /></div>
              <div class="field">
                <label>Color</label>
                <select name="color" [(ngModel)]="form.color">
                  <option value="sage">Sage</option>
                  <option value="clay">Clay</option>
                  <option value="slate">Slate</option>
                </select>
              </div>
            </div>
            <div class="field"><label>Conditions</label><textarea name="conditions" [(ngModel)]="form.conditions"></textarea></div>
            <div class="field"><label>Allergies</label><input name="allergies" [(ngModel)]="form.allergies" /></div>
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
export class People implements OnInit {
  private api = inject(Api);
  people = signal<Person[]>([]);
  open = false;
  fmtDob = fmtDob;
  form = { name: "", preferred_name: "", relationship: "", date_of_birth: "", conditions: "", allergies: "", color: "sage" };

  async ngOnInit() {
    this.people.set(await this.api.get<Person[]>("/people"));
  }

  async save() {
    await this.api.post("/people", this.form);
    this.open = false;
    this.form = { name: "", preferred_name: "", relationship: "", date_of_birth: "", conditions: "", allergies: "", color: "sage" };
    this.people.set(await this.api.get<Person[]>("/people"));
  }
}
