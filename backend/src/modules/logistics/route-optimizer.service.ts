import { Injectable } from '@nestjs/common';

interface Point {
  lat: number;
  lng: number;
  address: string;
}

@Injectable()
export class RouteOptimizerService {
  // Distance entre deux points (formule de Haversine)
  private haversineDistance(point1: Point, point2: Point): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Algorithme du plus proche voisin pour optimiser les tournées
  optimizeRoute(depot: Point, deliveries: Point[]): { route: Point[]; totalDistance: number } {
    if (deliveries.length === 0) return { route: [depot], totalDistance: 0 };
    
    const unvisited = [...deliveries];
    const route = [depot];
    let totalDistance = 0;
    let current = depot;
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.haversineDistance(current, unvisited[0]);
      
      for (let i = 1; i < unvisited.length; i++) {
        const dist = this.haversineDistance(current, unvisited[i]);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = i;
        }
      }
      
      totalDistance += nearestDistance;
      current = unvisited[nearestIndex];
      route.push(current);
      unvisited.splice(nearestIndex, 1);
    }
    
    // Retour au dépôt
    totalDistance += this.haversineDistance(current, depot);
    route.push(depot);
    
    return { route, totalDistance };
  }

  // Calcul du temps estimé (vitesse moyenne 30 km/h en ville)
  estimateTime(distance: number): number {
    const speed = 30; // km/h
    return distance / speed; // heures
  }

  // Formatage de l'itinéraire
  formatRoute(route: Point[], totalDistance: number): any {
    return {
      stops: route.map((p, i) => ({
        stopNumber: i,
        address: p.address,
        lat: p.lat,
        lng: p.lng
      })),
      totalDistance: totalDistance.toFixed(2),
      estimatedTime: this.estimateTime(totalDistance).toFixed(2),
      estimatedTimeInHours: this.estimateTime(totalDistance).toFixed(1)
    };
  }
}
