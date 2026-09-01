import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { LumenService } from "./lumen.service.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() health() {
    return this.lumen.health();
  }
}

@Controller("dashboard")
export class DashboardController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() dashboard() {
    return this.lumen.dashboard();
  }
}

@Controller("people")
export class PeopleController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() list() {
    return this.lumen.listPeople();
  }
  @Get(":id") one(@Param("id", ParseIntPipe) id: number) {
    return this.lumen.getPerson(id);
  }
  @Post() create(@Body() body: Record<string, unknown>) {
    return this.lumen.createPerson(body);
  }
  @Patch(":id") update(@Param("id", ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.lumen.updatePerson(id, body);
  }
}

@Controller("medications")
export class MedicationsController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() list(@Query("personId") personId?: string) {
    return this.lumen.listMedications(personId ? Number(personId) : undefined);
  }
  @Post() create(@Body() body: Record<string, unknown>) {
    return this.lumen.createMedication(body);
  }
  @Patch(":id") update(@Param("id", ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.lumen.updateMedication(id, body);
  }
  @Post(":id/doses") dose(@Param("id", ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.lumen.logDose(id, body);
  }
}

@Controller("appointments")
export class AppointmentsController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() list() {
    return this.lumen.listAppointments();
  }
  @Post() create(@Body() body: Record<string, unknown>) {
    return this.lumen.createAppointment(body);
  }
  @Patch(":id") update(@Param("id", ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.lumen.updateAppointment(id, body);
  }
  @Delete(":id") remove(@Param("id", ParseIntPipe) id: number) {
    return this.lumen.deleteAppointment(id);
  }
}

@Controller("tasks")
export class TasksController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() list() {
    return this.lumen.listTasks();
  }
  @Post() create(@Body() body: Record<string, unknown>) {
    return this.lumen.createTask(body);
  }
  @Patch(":id") update(@Param("id", ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.lumen.updateTask(id, body);
  }
  @Delete(":id") remove(@Param("id", ParseIntPipe) id: number) {
    return this.lumen.deleteTask(id);
  }
}

@Controller("journal")
export class JournalController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() list(@Query("personId") personId?: string) {
    return this.lumen.listJournal(personId ? Number(personId) : undefined);
  }
  @Post() create(@Body() body: Record<string, unknown>) {
    return this.lumen.createJournal(body);
  }
  @Delete(":id") remove(@Param("id", ParseIntPipe) id: number) {
    return this.lumen.deleteJournal(id);
  }
}

@Controller("team")
export class TeamController {
  constructor(@Inject(LumenService) private readonly lumen: LumenService) {}
  @Get() list() {
    return this.lumen.listTeam();
  }
  @Post() create(@Body() body: Record<string, unknown>) {
    return this.lumen.createTeam(body);
  }
  @Patch(":id") update(@Param("id", ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.lumen.updateTeam(id, body);
  }
  @Delete(":id") remove(@Param("id", ParseIntPipe) id: number) {
    return this.lumen.deleteTeam(id);
  }
}
