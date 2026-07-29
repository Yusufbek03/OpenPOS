import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  type OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      process.env['ADMIN_URL'] ?? 'http://localhost:5173',
      process.env['POS_URL'] ?? 'http://localhost:5174',
      process.env['KITCHEN_URL'] ?? 'http://localhost:5175',
      process.env['CUSTOMER_DISPLAY_URL'] ?? 'http://localhost:5176',
    ],
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedClients = new Map<string, { userId?: string; deviceId?: string }>();

  afterInit(_server: Server): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, {});
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; deviceId?: string },
  ): void {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.userId = data.userId;
      clientInfo.deviceId = data.deviceId;
    }
    client.emit('auth', { success: true });
  }

  @SubscribeMessage('join:branch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { branchId: string },
  ): void {
    client.join(`branch:${data.branchId}`);
    client.emit('join:branch', { success: true, branchId: data.branchId });
  }

  @SubscribeMessage('join:kitchen')
  handleJoinKitchen(@ConnectedSocket() client: Socket): void {
    client.join('kitchen');
    client.emit('join:kitchen', { success: true });
  }

  @SubscribeMessage('join:dashboard')
  handleJoinDashboard(@ConnectedSocket() client: Socket): void {
    client.join('dashboard');
    client.emit('join:dashboard', { success: true });
  }

  broadcast(event: string, data: Record<string, unknown>, room?: string): void {
    if (room) {
      this.server.to(room).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }

  emitToBranch(branchId: string, event: string, data: Record<string, unknown>): void {
    this.server.to(`branch:${branchId}`).emit(event, data);
  }

  emitToKitchen(event: string, data: Record<string, unknown>): void {
    this.server.to('kitchen').emit(event, data);
  }

  emitToDashboard(event: string, data: Record<string, unknown>): void {
    this.server.to('dashboard').emit(event, data);
  }

  getConnectionCount(): number {
    return this.connectedClients.size;
  }
}
