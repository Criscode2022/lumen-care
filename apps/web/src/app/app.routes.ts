import { Routes } from "@angular/router";
import { Shell } from "./ui/shell";
import { Landing } from "./pages/landing";
import { Today } from "./pages/today";
import { People } from "./pages/people";
import { PersonPage } from "./pages/person";
import { Meds } from "./pages/meds";
import { CalendarPage } from "./pages/calendar";
import { Tasks } from "./pages/tasks";
import { Journal } from "./pages/journal";
import { Team } from "./pages/team";

export const routes: Routes = [
  { path: "", component: Landing },
  {
    path: "app",
    component: Shell,
    children: [
      { path: "", component: Today },
      { path: "people", component: People },
      { path: "people/:id", component: PersonPage },
      { path: "meds", component: Meds },
      { path: "calendar", component: CalendarPage },
      { path: "tasks", component: Tasks },
      { path: "journal", component: Journal },
      { path: "team", component: Team },
    ],
  },
];
