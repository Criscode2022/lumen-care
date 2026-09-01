import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Api, Person } from "../api";
import { Icon } from "../ui/icon";

type Task = {
  id: number;
  title: string;
  details: string | null;
  due_on: string | null;
  status: string;
  priority: string;
  person_name: string | null;
  color: string | null;
};

@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [FormsModule, Icon],
  template: `
    <main class="main">
      <header style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:24px">
        <div>
          <p class="kicker">Work</p>
          <h1 class="display" style="font-size:clamp(1.8rem,4vw,2.4rem);margin-top:6px">Tasks</h1>
        </div>
        <button class="btn btn-primary" (click)="open=true"><app-icon name="plus" /> Add</button>
      </header>
      <div class="list">
        @for (t of items(); track t.id) {
          <article class="row">
            <button class="btn btn-ghost btn-icon" (click)="toggle(t)" [attr.aria-label]="'Mark ' + t.title">
              <app-icon name="check" />
            </button>
            <div style="flex:1;opacity: {{ t.status==='done' ? '0.5' : '1' }}">
              <strong>{{ t.title }}</strong>
              <p class="muted" style="font-size:.85rem">
                {{ t.person_name || 'Household' }}
                @if (t.due_on) { · due {{ t.due_on }} }
              </p>
              @if (t.details) { <p style="margin-top:4px">{{ t.details }}</p> }
            </div>
            <span class="chip" [class.chip-warn]="t.priority==='high'" [class.chip-mute]="t.status==='done'">{{ t.status==='done' ? 'done' : t.priority }}</span>
          </article>
        }
      </div>
      @if (open) {
        <div class="modal-back" (click)="open=false">
          <form class="modal form-grid" (click)="$event.stopPropagation()" (ngSubmit)="save()">
            <h2 class="display" style="font-size:1.5rem">Add a task</h2>
            <div class="field"><label>Title</label><input name="title" [(ngModel)]="form.title" required /></div>
            <div class="field">
              <label>Person (optional)</label>
              <select name="person_id" [(ngModel)]="form.person_id">
                <option [ngValue]="''">Household</option>
                @for (p of people(); track p.id) { <option [ngValue]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div class="form-grid form-grid-2">
              <div class="field"><label>Due</label><input type="date" name="due_on" [(ngModel)]="form.due_on" /></div>
              <div class="field">
                <label>Priority</label>
                <select name="priority" [(ngModel)]="form.priority">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div class="field"><label>Details</label><textarea name="details" [(ngModel)]="form.details"></textarea></div>
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
export class Tasks implements OnInit {
  private api = inject(Api);
  items = signal<Task[]>([]);
  people = signal<Person[]>([]);
  open = false;
  form = { title: "", person_id: "" as number | "", due_on: "", priority: "normal", details: "" };

  async ngOnInit() {
    this.people.set(await this.api.get<Person[]>("/people"));
    await this.reload();
  }
  async reload() {
    this.items.set(await this.api.get<Task[]>("/tasks"));
  }
  async save() {
    await this.api.post("/tasks", {
      title: this.form.title,
      details: this.form.details,
      due_on: this.form.due_on || null,
      priority: this.form.priority,
      person_id: this.form.person_id === "" ? null : Number(this.form.person_id),
    });
    this.open = false;
    this.form = { title: "", person_id: "", due_on: "", priority: "normal", details: "" };
    await this.reload();
  }
  async toggle(t: Task) {
    const next = t.status === "done" ? "open" : "done";
    await this.api.patch(`/tasks/${t.id}`, { status: next });
    await this.reload();
  }
}
