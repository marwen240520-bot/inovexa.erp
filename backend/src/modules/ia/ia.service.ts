import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IaChat } from './entities/ia-chat.entity';

@Injectable()
export class IaService {
  constructor(
    @InjectRepository(IaChat)
    private iaChatRepository: Repository<IaChat>,
  ) {}

  async getChatHistory(userId: number) {
    return this.iaChatRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
      take: 100
    });
  }

  async saveChatMessage(userId: number, role: string, content: string) {
    const message = this.iaChatRepository.create({ userId, role, content });
    return this.iaChatRepository.save(message);
  }

  async getAlerts(userId: number) {
    // Données de démonstration
    return [
      { type: "info", message: "📈 Croissance des ventes: +15% ce mois", date: new Date() },
      { type: "warning", message: "⚠️ Stock faible: 3 produits en dessous du seuil", date: new Date() },
      { type: "success", message: "✅ Objectif mensuel atteint à 85%", date: new Date() }
    ];
  }

  async getComparisonStats(userId: number) {
    return {
      salesGrowth: 15.2,
      clientGrowth: 8.5,
      profitGrowth: 12.3,
      avgOrderGrowth: 5.8
    };
  }

  async exportAnalytics(userId: number) {
    return {
      generatedAt: new Date(),
      summary: "Rapport d'analyse IA",
      recommendations: [
        "Augmenter le stock des produits les plus vendus",
        "Cibler les clients inactifs avec des offres",
        "Optimiser les campagnes marketing"
      ]
    };
  }

  async getPredictions(userId: number) {
    return {
      nextMonthSales: 125000,
      nextMonthProfit: 45000,
      growthRate: 15,
      confidence: 85
    };
  }
}
