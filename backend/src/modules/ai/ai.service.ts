import { Injectable } from '@nestjs/common';

@Injectable()
export class AIService {
  async chat(message: string): Promise<string> {
    const responses = [
      'Je peux vous aider avec la gestion des factures, des stocks, des employés et des clients.',
      'Pour créer une facture, allez dans le menu Finance > Factures et cliquez sur "Nouvelle facture".',
      'Le stock actuel peut être consulté dans le menu Inventory > Produits.',
      'Les rapports financiers sont disponibles dans la section Analytics.',
      'Je vous recommande de vérifier les alertes de stock bas régulièrement.',
    ];
    const index = Math.floor(Math.random() * responses.length);
    return responses[index];
  }

  async predictSales(): Promise<any> {
    return {
      next_month: 125000,
      growth: 15,
      confidence: 85,
      recommendations: ['Augmenter le stock des produits A', 'Campagne marketing pour produits B'],
    };
  }
}
