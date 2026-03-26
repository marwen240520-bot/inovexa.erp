import { Injectable } from '@nestjs/common';

@Injectable()
export class AIService {
  async getResponse(message: string): Promise<string> {
    return "Je suis l'assistant IA. Comment puis-je vous aider ?";
  }
}
