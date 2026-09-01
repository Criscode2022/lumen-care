import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Api } from "../api";
import { Icon } from "../ui/icon";

type Member = { id: number; name: string; role: string; phone: string | null; email: string | null; notes: string | null };

@Component({
  selector: "app-team",
  standalone: true,
  imports: [FormsModule, Icon],
  template: `
    <main class="main">
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:24px">
        <div>
          <p class="kicker">Who shows up</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.4rem);margin-top:6px">The circle</h1>
        </div>
        <button class="btn btn-primary" (click)="open=true"><app-icon name="plus" /> Add</button>
      </header>
      <div class="list">
        @for (m of items(); track m.id) {
          <article class="row">
            <div style="flex:1">
              <strong>{{ m.name }}</strong>
              <p class="muted" style="font-size:.85rem;text-transform:capitalize">{{ m.role }} @if (m.phone) { · {{ m.phone }} }</p>
              @if (m.email) { <p class="muted" style="font-size:.85rem">{{ m.email }}</p> }
              @if (m.notes) { <p style="margin-top:6px">{{ m.notes }}</p> }
            </div>
          </article>
        }
      </div>
      @if (open) {
        <div class="modal-back" (click)="open=false">
          <form class="modal form-grid" (click)="$event.stopPropagation()" (ngSubmit)="save()">
            <h2 class="display" style="font-size:1.5rem">Add to the circle</h2>
            <div class="field"><label>Name</label><input name="name" [(ngModel)]="form.name" required /></div>
            <div class="field">
              <label>Role</label>
              <select name="role" [(ngModel)]="form.role">
                <option value="family">Family</option>
                <option value="primary">Primary caregiver</option>
                <option value="clinician">Clinician</option>
                <option value="aide">Aide</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-grid form-grid-2">
              <div class="field"><label>Phone</label><input name="phone" [(ngModel)]="form.phone" /></div>
              <div class="field"><label>Email</label><input name="email" [(ngModel)]="form.email" /></div>
            </div>
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
export class Team implements OnInit {
  private api = inject(Api);
  items = signal<Member[]>([]);
  open = false;
  form = { name: "", role: "family", phone: "", email: "", notes: "" };

  async ngOnInit() {
    this.items.set(await this.api.get<Member[]>("/team"));
  }
  async save() {
    await this.api.post("/team", this.form);
    this.open = false;
    this.form = { name: "", role: "family", phone: "", email: "", notes: "" };
    this.items.set(await this.api.get<Member[]>("/team"));
  }
}
