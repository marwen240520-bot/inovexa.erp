import { Controller, Post, Body, Get } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('chat')
  async chat(@Body() body: { message: string }) {
    const response = await this.aiService.chat(body.message);
    return { response };
  }

  @Get('predictions/sales')
  async getSalesPredictions() {
    return this.aiService.predictSales();
  }
}
