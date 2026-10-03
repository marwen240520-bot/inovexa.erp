import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Employee } from './entities/employee.entity';

import { pick, toText, toNumber, toDate, normalizeStatus, ACTIVE_STATUS, isEmptyRow, buildImportResult, errorMessage, ImportErrorDetail } from '../../common/import-utils';
@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async findAll(userId: number) {
    return this.employeeRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const employee = await this.employeeRepository.findOne({ where: { id, userId } });
    if (!employee) throw new NotFoundException('Employé non trouvé');
    return employee;
  }

  async create(userId: number, data: any) {
    const employee = this.employeeRepository.create({
      ...data,
      userId,
      hireDate: data.hireDate ? new Date(data.hireDate) : null
    });
    return this.employeeRepository.save(employee);
  }

  async update(id: number, userId: number, data: any) {
    const employee = await this.findOne(id, userId);
    if (data.hireDate) data.hireDate = new Date(data.hireDate);
    Object.assign(employee, data);
    return this.employeeRepository.save(employee);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const employee = await this.findOne(id, userId);
    employee.status = status;
    return this.employeeRepository.save(employee);
  }

  async delete(id: number, userId: number) {
    const employee = await this.findOne(id, userId);
    await this.employeeRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const employees = await this.findAll(userId);
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const onLeave = employees.filter(e => e.status === 'leave').length;
    const inactive = employees.filter(e => e.status === 'inactive').length;
    const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const avgSalary = total > 0 ? totalPayroll / total : 0;
    
    return { total, active, onLeave, inactive, totalPayroll, avgSalary };
  }

  async importEmployees(userId: number, rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('Aucun employé à importer');
    const details: ImportErrorDetail[] = [];
    let success = 0;
    let processed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (isEmptyRow(row)) continue;
      processed++;
      try {
        let name = toText(pick(row, ['name', 'nom complet', 'full name', 'fullname', 'employe', 'employee', 'nom et prenom']));
        if (!name) {
          // Colonnes séparées "Prénom" + "Nom"
          const first = toText(pick(row, ['prenom', 'firstname', 'first name']));
          const last = toText(pick(row, ['nom', 'lastname', 'last name', 'nom de famille']));
          name = [first, last].filter(Boolean).join(' ') || null;
        }
        if (!name) throw new Error(`Nom de l'employé manquant (colonnes reçues : ${Object.keys(row).join(', ')})`);

        const hire = toDate(pick(row, ['hireDate', 'hire date', 'date embauche', "date d'embauche", 'embauche', 'date']));
        const now = new Date().toISOString();
        const entity = this.employeeRepository.create({
          userId,
          name,
          email: toText(pick(row, ['email', 'e-mail', 'mail', 'courriel'])) || '',
          position: toText(pick(row, ['position', 'poste', 'fonction', 'job title', 'titre'])) || undefined,
          department: toText(pick(row, ['department', 'departement', 'service'])) || undefined,
          salary: toNumber(pick(row, ['salary', 'salaire', 'salaire brut', 'remuneration'])),
          phone: toText(pick(row, ['phone', 'telephone', 'tel', 'mobile', 'gsm'])) || undefined,
          hireDate: hire ? hire.toISOString().slice(0, 10) : undefined,
          status: normalizeStatus(
            pick(row, ['status', 'statut', 'etat']),
            { active: ['actif', 'active'], inactive: ['inactif', 'inactive'], on_leave: ['conge', 'en conge', 'on leave', 'leave', 'on_leave'] },
            'active',
          ),
          createdAt: now,
          updatedAt: now,
        } as any);
        await this.employeeRepository.save(entity);
        success++;
      } catch (e) {
        details.push({ row: i + 2, error: errorMessage(e) });
      }
    }
    return buildImportResult('employé(s)', processed, success, details);
  }
}
