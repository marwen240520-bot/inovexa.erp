import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './workflow.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private notificationsGateway: NotificationsGateway,
    private emailService: EmailService,
  ) {}

  async findAll(): Promise<Workflow[]> {
    return this.workflowRepository.find();
  }

  async create(data: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflowRepository.create(data);
    return this.workflowRepository.save(workflow);
  }

  async update(id: string, data: Partial<Workflow>): Promise<Workflow | null> {
    await this.workflowRepository.update(id, data);
    return this.workflowRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.workflowRepository.delete(id);
  }

  async execute(trigger: string, data: any): Promise<void> {
    const workflows = await this.workflowRepository.find({ where: { trigger, isActive: true } });
    
    for (const workflow of workflows) {
      await this.executeAction(workflow.action, workflow.actionConfig, data);
    }
  }

  private async executeAction(action: string, config: any, data: any): Promise<void> {
    switch (action) {
      case 'send_email':
        await this.emailService.sendEmail(config.to, config.subject, config.template, data);
        break;
      case 'send_notification':
        this.notificationsGateway.sendToAll({
          type: 'workflow',
          message: config.message,
          data
        });
        break;
      case 'create_invoice':
        // Logique création facture automatique
        console.log('Création facture auto', data);
        break;
      default:
        console.log(`Action non reconnue: ${action}`);
    }
  }
}
