import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'stock' })
export class StockGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.clients.set(userId, client);
      console.log(`Client stock connecté: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.clients.entries()).find(([_, sock]) => sock === client)?.[0];
    if (userId) {
      this.clients.delete(userId);
      console.log(`Client stock déconnecté: ${userId}`);
    }
  }

  async sendStockUpdate(productId: string) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    this.server.emit('stock-update', { productId, quantity: product?.quantity });
    
    if (product && product.quantity < 10) {
      this.server.emit('low-stock-alert', { productId, productName: product.name, quantity: product.quantity });
    }
  }

  @SubscribeMessage('subscribe-stock')
  handleSubscribe(client: Socket) {
    client.emit('subscribed', { message: 'Abonné aux mises à jour stock' });
  }
}
