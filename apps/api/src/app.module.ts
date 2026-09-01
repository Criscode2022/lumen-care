import { Module } from "@nestjs/common";
import { Database } from "./database.js";
import {
  AppointmentsController,
  DashboardController,
  HealthController,
  JournalController,
  MedicationsController,
  PeopleController,
  TasksController,
  TeamController,
} from "./http.js";
import { LumenService } from "./lumen.service.js";

@Module({
  providers: [Database, LumenService],
  controllers: [
    HealthController,
    DashboardController,
    PeopleController,
    MedicationsController,
    AppointmentsController,
    TasksController,
    JournalController,
    TeamController,
  ],
})
export class AppModule {}
