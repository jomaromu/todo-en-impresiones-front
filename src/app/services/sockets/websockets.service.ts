import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketsService {

  private socket: Socket;
  public socketStatus = false;

  constructor() {
    this.socket = io(environment.url);
    this.checkStatus();
  }

  checkStatus(): void {

    // escuchar el servidor
    this.socket.on('connect', () => {
      console.log('Conectado al servidor');
      this.socketStatus = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor');
      this.socketStatus = false;
    });
  }

  // Emitir eventos
  emitir(evento: string, payload?: any, callback?: any): void {
    this.socket.emit(evento, payload, callback);
  }

  // Escuchar eventos
  escuchar(evento: string): Observable<any> {

    return new Observable((subscriber) => {
      this.socket.on(evento, (callback: any) => {
        subscriber.next(callback);
      });
    });
  }
}
