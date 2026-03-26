import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  @Post('chat')
  async chat(@Body() body: { message: string }) {
    const msg = body.message.toLowerCase();
    let response = '';
    
    if (msg.includes('bonjour') || msg.includes('salut')) {
      response = 'Bonjour ! Je suis l\'assistant IA d\'Inovexa. Comment puis-je vous aider ?';
    } else if (msg.includes('ca') || msg.includes('chiffre')) {
      response = 'Le chiffre d\'affaires total est de 125 000€ ce mois-ci.';
    } else if (msg.includes('stock')) {
      response = 'Il y a 3 produits en stock bas. Consultez le module Stock.';
    } else if (msg.includes('facture')) {
      response = 'Vous avez 5 factures en attente de paiement.';
    } else {
      response = 'Je suis votre assistant. Posez-moi une question sur le CA, les stocks ou les factures.';
    }
    
    return { response };
  }

  @Get('predictions')
  async predictions() {
    return {
      sales: [
        { month: 'Mois prochain', value: 14500, trend: 'up' },
        { month: 'Dans 2 mois', value: 15800, trend: 'up' },
        { month: 'Dans 3 mois', value: 17200, trend: 'up' }
      ]
    };
  }
}
