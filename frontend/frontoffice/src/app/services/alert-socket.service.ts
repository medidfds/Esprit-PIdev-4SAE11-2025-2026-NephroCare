import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';

declare const SockJS: any;

@Injectable({
    providedIn: 'root'
})
export class AlertSocketService {

    private stompClient!: Client;
    private alertSubject = new Subject<any>();

    public alerts$ = this.alertSubject.asObservable();

    connect() {
        this.stompClient = new Client({
            webSocketFactory: () => {
                console.log('🔌 Tentative de connexion WebSocket sur: /ws-alerts');
                return new SockJS('/ws-alerts', null, {
                    transports: ['websocket', 'xhr-streaming', 'xhr-polling']
                });
            },
            reconnectDelay: 5000,
            debug: (str: string) => {
                console.log('STOMP: ' + str);
            }
        });

        this.stompClient.onConnect = (frame: any) => {
            console.log('✅ Connected to WebSocket: ' + frame);

            this.stompClient.subscribe('/topic/alerts', (message: IMessage) => {
                try {
                    const alert = JSON.parse(message.body);
                    this.alertSubject.next(alert);
                } catch (e) {
                    console.error('Error parsing WebSocket message', e);
                }
            });
        };

        this.stompClient.onStompError = (frame: any) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        this.stompClient.onWebSocketError = (event: any) => {
            console.error('❌ Erreur WebSocket Bas-niveau:', event);
        };

        this.stompClient.onWebSocketClose = () => {
            console.warn('⚠️ Connexion WebSocket fermée.');
        };

        this.stompClient.activate();
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
        }
    }
}