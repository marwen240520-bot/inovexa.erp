import { Injectable } from '@nestjs/common';

interface DeliveryPoint {
  id: string;
  address: string;
  lat: number;
  lng: number;
  weight: number;
  timeWindow?: { start: string; end: string };
}

interface Vehicle {
  id: string;
  capacity: number;
  maxWeight: number;
  speed: number;
}

@Injectable()
export class AdvancedRouteOptimizer {
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  optimizeWithVehicles(depot: DeliveryPoint, deliveries: DeliveryPoint[], vehicles: Vehicle[]): any {
    const routes = [];
    let remainingDeliveries = [...deliveries];
    
    for (const vehicle of vehicles) {
      if (remainingDeliveries.length === 0) break;
      
      let currentLoad = 0;
      let route = [depot];
      let currentLocation = depot;
      let totalDistance = 0;
      let vehicleDeliveries = [];
      
      for (let i = 0; i < remainingDeliveries.length && currentLoad < vehicle.maxWeight; i++) {
        const delivery = remainingDeliveries[i];
        if (currentLoad + delivery.weight <= vehicle.maxWeight) {
          const distance = this.haversineDistance(currentLocation.lat, currentLocation.lng, delivery.lat, delivery.lng);
          totalDistance += distance;
          currentLoad += delivery.weight;
          route.push(delivery);
          vehicleDeliveries.push(delivery);
          currentLocation = delivery;
          remainingDeliveries.splice(i, 1);
          i--;
        }
      }
      
      route.push(depot);
      totalDistance += this.haversineDistance(currentLocation.lat, currentLocation.lng, depot.lat, depot.lng);
      
      routes.push({
        vehicleId: vehicle.id,
        stops: route.map((p, i) => ({ stopNumber: i, address: p.address, lat: p.lat, lng: p.lng })),
        totalDistance: totalDistance.toFixed(2),
        totalTime: (totalDistance / vehicle.speed).toFixed(2),
        totalWeight: currentLoad,
        deliveriesCount: vehicleDeliveries.length
      });
    }
    
    return {
      routes,
      unassignedDeliveries: remainingDeliveries,
      totalDistance: routes.reduce((s, r) => s + parseFloat(r.totalDistance), 0).toFixed(2),
      totalVehiclesUsed: routes.length
    };
  }

  calculateETA(depot: DeliveryPoint, delivery: DeliveryPoint, vehicleSpeed: number = 30): number {
    const distance = this.haversineDistance(depot.lat, depot.lng, delivery.lat, delivery.lng);
    return distance / vehicleSpeed;
  }

  getOptimalOrder(deliveries: DeliveryPoint[], depot: DeliveryPoint): DeliveryPoint[] {
    const unvisited = [...deliveries];
    const route = [];
    let current = depot;
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.haversineDistance(current.lat, current.lng, unvisited[0].lat, unvisited[0].lng);
      
      for (let i = 1; i < unvisited.length; i++) {
        const dist = this.haversineDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = i;
        }
      }
      
      route.push(unvisited[nearestIndex]);
      current = unvisited[nearestIndex];
      unvisited.splice(nearestIndex, 1);
    }
    
    return route;
  }
}
