import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Icon } from "../ui/icon";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [RouterLink, Icon],
  template: `
    <div style="max-width:1120px;margin:0 auto;padding:20px 16px 72px">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0 32px">
        <a routerLink="/" style="display:flex;align-items:center;gap:10px">
          <span class="mark"><app-icon name="mark" /></span>
          <span class="display" style="font-size:1.35rem">Lumen</span>
        </a>
        <a class="btn btn-primary" routerLink="/app">Open the board</a>
      </header>

      <section style="display:grid;gap:28px;padding:12px 0 40px">
        <p class="kicker">For the people who keep the household well</p>
        <h1 class="display" style="font-size:clamp(2.6rem, 7vw, 5.2rem); max-width:16ch">
          Care, coordinated.
        </h1>
        <p class="muted" style="max-width:42ch;font-size:1.125rem">
          Medications, appointments, and the family circle — in one quiet place.
          Built for the 53 million unpaid caregivers who currently run this from a
          notes app, a fridge calendar, and memory.
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <a class="btn btn-primary" routerLink="/app">Enter the Voss circle</a>
          <a class="btn btn-ghost" href="#how">See how it works</a>
        </div>
      </section>

      <div class="hero-preview" aria-hidden="true">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span class="display" style="font-size:1.5rem">Tuesday morning</span>
          <span style="opacity:.7;font-size:.85rem">Two people in care</span>
        </div>
        <div style="display:grid;gap:10px">
          <div class="ghost" style="display:flex;justify-content:space-between;align-items:center">
            <span>Elena · Carbidopa/Levodopa</span>
            <span style="opacity:.7">7:00 · due</span>
          </div>
          <div class="ghost" style="display:flex;justify-content:space-between;align-items:center">
            <span>Theo · Insulin lispro</span>
            <span style="opacity:.7">7:30 · breakfast</span>
          </div>
          <div class="ghost" style="display:flex;justify-content:space-between;align-items:center">
            <span>Physical therapy · Harbor PT</span>
            <span style="opacity:.7">2:00</span>
          </div>
        </div>
      </div>

      <section id="how" style="display:grid;gap:16px;padding:56px 0 24px">
        <h2 class="display" style="font-size:clamp(1.8rem, 4vw, 2.6rem)">What the board holds</h2>
        <div class="grid-stats">
          <article class="card">
            <app-icon name="pill" />
            <h3 style="margin:12px 0 6px;font-weight:600">The day’s doses</h3>
            <p class="muted">Scheduled times, taken or skipped with one tap, and a seven-day adherence read.</p>
          </article>
          <article class="card">
            <app-icon name="calendar" />
            <h3 style="margin:12px 0 6px;font-weight:600">Clinic, lab, school</h3>
            <p class="muted">Every visit in one calendar, with who it is for and what to bring.</p>
          </article>
          <article class="card">
            <app-icon name="users" />
            <h3 style="margin:12px 0 6px;font-weight:600">The circle</h3>
            <p class="muted">Primary, family, clinicians, aides — names and numbers at hand when something shifts.</p>
          </article>
        </div>
      </section>

      <footer class="muted" style="padding-top:48px;font-size:.85rem;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <span>Lumen · care coordination OS</span>
        <span>Demo data is fictional. Not a medical device.</span>
      </footer>
    </div>
  `,
})
export class Landing {}
