import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, template: string, data: any) {
    console.log(`📧 Email envoyé à ${to}: ${subject}`);
    return { success: true };
  }
}
