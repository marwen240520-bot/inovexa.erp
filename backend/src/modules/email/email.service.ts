import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, template: string, data: any) {
    console.log(`Sending email to ${to}: ${subject}`);
    return { success: true };
  }
}
