import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave } from './leave.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class LeaveWorkflowService {
  constructor(
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async requestLeave(employeeId: string, employeeName: string, startDate: Date, endDate: Date, type: string): Promise<Leave> {
    const leave = this.leaveRepository.create({
      employeeId,
      employeeName,
      startDate,
      endDate,
      type,
      status: 'pending'
    });
    const saved = await this.leaveRepository.save(leave);
    
    this.notificationsGateway.sendToAll({
      type: 'leave_request',
      employeeId,
      message: `Nouvelle demande de congé de ${employeeName}`
    });
    
    return saved;
  }

  async approveLeave(id: string, approverId: string): Promise<Leave | null> {
    await this.leaveRepository.update(id, { status: 'approved', approvedBy: approverId });
    const leave = await this.leaveRepository.findOne({ where: { id } });
    
    if (leave) {
      this.notificationsGateway.sendNotification(leave.employeeId, {
        type: 'leave_approved',
        message: `Votre demande de congé a été approuvée`
      });
    }
    
    return leave;
  }

  async getPendingLeaves(): Promise<Leave[]> {
    return this.leaveRepository.find({ where: { status: 'pending' }, order: { createdAt: 'ASC' } });
  }
}
