import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Project, ProjectTask, PROJECT_STATUSES, TASK_STATUSES } from './entities/project.entity';

const text = (v: unknown, max: number): string | null => {
  const s = String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
  return s ? s.slice(0, max) : null;
};
const isoDate = (v: unknown, label: string): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())) throw new BadRequestException(`${label} invalide (AAAA-MM-JJ).`);
  return s;
};
const amount = (v: unknown, label: string): number => {
  const n = v === null || v === undefined || v === '' ? 0 : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) throw new BadRequestException(`${label} invalide.`);
  return Math.round(n * 100) / 100;
};

export interface ProjectView extends Project {
  tasksTotal: number;
  tasksDone: number;
  /** Tâches non terminées dont l'échéance est passée. */
  tasksLate: number;
}

/**
 * Projets, chantiers et missions de la société, avec leurs tâches.
 * Toutes les lectures et écritures sont filtrées sur `userId` (la société de la personne connectée).
 */
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(ProjectTask) private taskRepository: Repository<ProjectTask>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  /** Liste fermée des champs acceptés : identifiant, société et dates techniques ne viennent jamais du navigateur. */
  private async clean(userId: number, body: any, current?: Project): Promise<Partial<Project>> {
    const out: Partial<Project> = {};
    const has = (k: string) => body && Object.prototype.hasOwnProperty.call(body, k);
    if (!current || has('name')) {
      const name = text(body?.name, 160);
      if (!name || name.length < 2) throw new BadRequestException('Indiquez le nom du projet.');
      out.name = name;
    }
    if (has('code')) out.code = text(body.code, 40);
    if (has('department')) out.department = text(body.department, 120) as any;
    if (has('description')) out.description = text(body.description, 4000);
    if (has('location')) out.location = text(body.location, 200);
    if (has('manager')) out.manager = text(body.manager, 120);
    if (has('clientId')) {
      const id = Number(body.clientId);
      if (!id) out.clientId = null;
      else {
        const [client] = await this.ds.query(`SELECT "id", "name" FROM "clients" WHERE "id" = $1 AND "userId" = $2`, [id, userId]);
        if (!client) throw new BadRequestException('Client introuvable.');
        out.clientId = client.id;
        if (!text(body.clientName, 160)) out.clientName = text(client.name, 160);
      }
    }
    if (has('clientName') && text(body.clientName, 160)) out.clientName = text(body.clientName, 160);
    else if (has('clientName') && !out.clientName) out.clientName = null;
    if (has('startDate')) out.startDate = isoDate(body.startDate, 'Date de début');
    if (has('endDate')) out.endDate = isoDate(body.endDate, 'Date de fin');
    const start = out.startDate !== undefined ? out.startDate : current?.startDate ?? null;
    const end = out.endDate !== undefined ? out.endDate : current?.endDate ?? null;
    if (start && end && end < start) throw new BadRequestException('La date de fin doit être après la date de début.');
    if (has('budget')) out.budget = amount(body.budget, 'Budget');
    if (has('cost')) out.cost = amount(body.cost, 'Coût');
    if (has('status')) {
      if (!(PROJECT_STATUSES as readonly string[]).includes(String(body.status))) throw new BadRequestException('État invalide.');
      out.status = String(body.status);
    }
    if (has('priority')) {
      const p = body.priority ? String(body.priority) : null;
      if (p !== null && !['low', 'normal', 'high'].includes(p)) throw new BadRequestException('Priorité invalide.');
      out.priority = p;
    }
    if (has('progress')) {
      const n = Number(body.progress);
      if (!Number.isFinite(n) || n < 0 || n > 100) throw new BadRequestException('Avancement invalide (0 à 100).');
      out.progress = Math.round(n);
    }
    return out;
  }

  private async withTasks(userId: number, projects: Project[]): Promise<ProjectView[]> {
    if (!projects.length) return [];
    const rows: Array<{ projectId: number; total: number; done: number; late: number }> = await this.ds.query(
      `SELECT "projectId", COUNT(*)::int AS "total", COUNT(*) FILTER (WHERE "status" = 'done')::int AS "done",
              COUNT(*) FILTER (WHERE "status" <> 'done' AND "dueDate" IS NOT NULL AND "dueDate" < CURRENT_DATE)::int AS "late"
         FROM "project_tasks" WHERE "userId" = $1 AND "projectId" = ANY($2) GROUP BY "projectId"`, [userId, projects.map((p) => p.id)]);
    const by = new Map(rows.map((r) => [Number(r.projectId), r]));
    return projects.map((p) => {
      const t = by.get(p.id);
      return { ...p, tasksTotal: t?.total ?? 0, tasksDone: t?.done ?? 0, tasksLate: t?.late ?? 0 };
    });
  }

  async findAll(userId: number) {
    const projects = await this.projectRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return this.withTasks(userId, projects);
  }

  private async row(id: number, userId: number): Promise<Project> {
    const project = Number.isInteger(id) ? await this.projectRepository.findOne({ where: { id, userId } }) : null;
    if (!project) throw new NotFoundException('Projet non trouvé');
    return project;
  }

  async findOne(id: number, userId: number) {
    const project = await this.row(id, userId);
    const [view] = await this.withTasks(userId, [project]);
    const tasks = await this.taskRepository.find({ where: { userId, projectId: project.id }, order: { sortOrder: 'ASC', id: 'ASC' } });
    return { ...view, tasks };
  }

  async create(userId: number, body: any) {
    const data = await this.clean(userId, body);
    const project = await this.projectRepository.save(this.projectRepository.create({ ...data, userId, status: data.status || 'active' }));
    // Tâches fournies à la création (modèle de chantier, étapes d'une mission).
    if (Array.isArray(body?.tasks)) {
      let order = 0;
      for (const t of body.tasks.slice(0, 100)) {
        const title = text(t?.title ?? t, 200);
        if (!title) continue;
        await this.taskRepository.save(this.taskRepository.create({ userId, projectId: project.id, title, assignee: text(t?.assignee, 120), dueDate: isoDate(t?.dueDate, 'Échéance'), status: 'todo', sortOrder: ++order }));
      }
    }
    return this.findOne(project.id, userId);
  }

  async update(id: number, userId: number, body: any) {
    const project = await this.row(id, userId);
    Object.assign(project, await this.clean(userId, body, project));
    await this.projectRepository.save(project);
    return this.findOne(project.id, userId);
  }

  async delete(id: number, userId: number) {
    const project = await this.row(id, userId);
    await this.taskRepository.delete({ userId, projectId: project.id });
    await this.projectRepository.delete({ id: project.id, userId });
    return { success: true };
  }

  // ───────────── Tâches ─────────────

  /** L'avancement suit les tâches dès que le projet en a : terminées / total. */
  private async syncProgress(userId: number, projectId: number) {
    const [{ total, done }] = await this.ds.query(
      `SELECT COUNT(*)::int AS "total", COUNT(*) FILTER (WHERE "status" = 'done')::int AS "done" FROM "project_tasks" WHERE "userId" = $1 AND "projectId" = $2`, [userId, projectId]);
    if (total > 0) await this.projectRepository.update({ id: projectId, userId }, { progress: Math.round((done / total) * 100) });
  }

  private cleanTask(body: any, current?: ProjectTask): Partial<ProjectTask> {
    const out: Partial<ProjectTask> = {};
    const has = (k: string) => body && Object.prototype.hasOwnProperty.call(body, k);
    if (!current || has('title')) {
      const title = text(body?.title, 200);
      if (!title) throw new BadRequestException('Indiquez l’intitulé de la tâche.');
      out.title = title;
    }
    if (has('assignee')) out.assignee = text(body.assignee, 120);
    if (has('dueDate')) out.dueDate = isoDate(body.dueDate, 'Échéance');
    if (has('status')) {
      if (!(TASK_STATUSES as readonly string[]).includes(String(body.status))) throw new BadRequestException('État de tâche invalide.');
      out.status = String(body.status);
    }
    if (has('sortOrder')) out.sortOrder = Math.trunc(Number(body.sortOrder)) || 0;
    return out;
  }

  async addTask(projectId: number, userId: number, body: any) {
    const project = await this.row(projectId, userId);
    const data = this.cleanTask(body);
    const [{ max }] = await this.ds.query(`SELECT COALESCE(MAX("sortOrder"), 0)::int AS "max" FROM "project_tasks" WHERE "userId" = $1 AND "projectId" = $2`, [userId, project.id]);
    await this.taskRepository.save(this.taskRepository.create({ ...data, userId, projectId: project.id, status: data.status || 'todo', sortOrder: data.sortOrder || Number(max) + 1 }));
    await this.syncProgress(userId, project.id);
    return this.findOne(project.id, userId);
  }

  async updateTask(projectId: number, taskId: number, userId: number, body: any) {
    const project = await this.row(projectId, userId);
    const task = Number.isInteger(taskId) ? await this.taskRepository.findOne({ where: { id: taskId, userId, projectId: project.id } }) : null;
    if (!task) throw new NotFoundException('Tâche introuvable');
    Object.assign(task, this.cleanTask(body, task));
    await this.taskRepository.save(task);
    await this.syncProgress(userId, project.id);
    return this.findOne(project.id, userId);
  }

  async deleteTask(projectId: number, taskId: number, userId: number) {
    const project = await this.row(projectId, userId);
    const res = await this.taskRepository.delete({ id: taskId, userId, projectId: project.id });
    if (!res.affected) throw new NotFoundException('Tâche introuvable');
    await this.syncProgress(userId, project.id);
    return this.findOne(project.id, userId);
  }

  /** Tâches en retard de toute la société (tableau de bord des projets). */
  async lateTasks(userId: number) {
    const tasks = await this.taskRepository.createQueryBuilder('t')
      .where(`t.userId = :userId AND t.status <> 'done' AND t.dueDate IS NOT NULL AND t.dueDate < CURRENT_DATE`, { userId })
      .orderBy('t.dueDate', 'ASC').take(100).getMany();
    const ids = Array.from(new Set(tasks.map((t) => t.projectId)));
    const projects = ids.length ? await this.projectRepository.find({ where: { userId, id: In(ids) }, select: ['id', 'name'] }) : [];
    const names = new Map(projects.map((p) => [p.id, p.name]));
    return tasks.map((t) => ({ ...t, projectName: names.get(t.projectId) || '' }));
  }
}
