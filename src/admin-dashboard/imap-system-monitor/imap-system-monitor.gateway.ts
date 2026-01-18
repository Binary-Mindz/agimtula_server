import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/imap-monitor' })
export class ImapSystemMonitorGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected to imap-monitor: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from imap-monitor: ${client.id}`);
  }

  emitInvoiceImport(data: any) {
    if (this.server) {
      this.server.emit('invoice-import', data);
    } else {
      console.error('Server instance is null!');
    }
  }
}
