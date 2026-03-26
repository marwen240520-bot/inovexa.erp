import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Customer } from '../customers/customer.entity';

@Injectable()
export class RFMAnalysisService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async analyze(): Promise<any> {
    const customers = await this.customerRepository.find();
    const results = [];

    for (const customer of customers) {
      const orders = await this.orderRepository.find({
        where: { clientId: customer.id },
        order: { createdAt: 'DESC' }
      });

      const lastOrder = orders[0];
      const recency = lastOrder ? Math.floor((new Date().getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 3600 * 24)) : 999;
      const frequency = orders.length;
      const monetary = orders.reduce((s, o) => s + (o.total || 0), 0);

      // Scores (1-5)
      const rScore = recency < 30 ? 5 : recency < 90 ? 4 : recency < 180 ? 3 : recency < 365 ? 2 : 1;
      const fScore = frequency > 10 ? 5 : frequency > 5 ? 4 : frequency > 2 ? 3 : frequency > 0 ? 2 : 1;
      const mScore = monetary > 10000 ? 5 : monetary > 5000 ? 4 : monetary > 1000 ? 3 : monetary > 0 ? 2 : 1;

      const totalScore = rScore + fScore + mScore;
      let segment = '';

      if (totalScore >= 12) segment = '🌟 Champions';
      else if (totalScore >= 9) segment = '⭐ Clients fidèles';
      else if (totalScore >= 6) segment = '📈 Clients potentiels';
      else if (totalScore >= 3) segment = '⚠️ Clients à risque';
      else segment = '💀 Clients perdus';

      results.push({
        customerId: customer.id,
        customerName: customer.name,
        email: customer.email,
        recency: recency,
        frequency: frequency,
        monetary: monetary,
        rScore, fScore, mScore,
        segment,
        recommendations: this.getRecommendations(segment)
      });
    }

    return {
      segments: {
        champions: results.filter(r => r.segment === '🌟 Champions').length,
        loyal: results.filter(r => r.segment === '⭐ Clients fidèles').length,
        potential: results.filter(r => r.segment === '📈 Clients potentiels').length,
        atRisk: results.filter(r => r.segment === '⚠️ Clients à risque').length,
        lost: results.filter(r => r.segment === '💀 Clients perdus').length
      },
      customers: results
    };
  }

  private getRecommendations(segment: string): string[] {
    switch (segment) {
      case '🌟 Champions':
        return ['Offrir un programme de fidélité VIP', 'Demander un témoignage', 'Proposer un parrainage'];
      case '⭐ Clients fidèles':
        return ['Envoyer une newsletter exclusive', 'Offrir une réduction personnalisée', 'Proposer des produits complémentaires'];
      case '📈 Clients potentiels':
        return ['Envoyer des offres promotionnelles', 'Relancer avec des nouveautés', 'Proposer un essai gratuit'];
      case '⚠️ Clients à risque':
        return ['Envoyer une enquête de satisfaction', 'Offrir une remise de fidélisation', 'Contacter par téléphone'];
      default:
        return ['Relance spéciale réactivation', 'Offre exclusive de retour', 'Enquête sur les raisons de départ'];
    }
  }
}
