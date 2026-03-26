import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedClients.set(userId, client);
    }
  }

  handleDisconnect(client: Socket) {
    const entry = Array.from(this.connectedClients.entries()).find(([_, sock]) => sock === client);
    if (entry) {
      this.connectedClients.delete(entry[0]);
    }
  }

  sendToAll(notification: any) {
    this.server.emit('notification', notification);
  }

  sendNotification(userId: string, notification: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit('notification', notification);
    }
  }
}
