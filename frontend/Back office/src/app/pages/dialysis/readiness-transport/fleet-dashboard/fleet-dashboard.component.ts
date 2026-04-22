import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportService } from '../../../../services/transport.service';
import { Vehicle } from '../models/transport.model';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from "../../../../../environments/environment";
import SockJS from 'sockjs-client/dist/sockjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-fleet-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fleet-dashboard.component.html',
  styleUrls: ['./fleet-dashboard.component.css'],      // ← add
  encapsulation: ViewEncapsulation.None
})
export class FleetDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  vehicles: Vehicle[] = [];
  selectedVehicleId: string | null = null;
  isLoading = false;
  connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private stompClient: Client | null = null;
  
  private map!: L.Map;
  private markersMap: Map<string, L.Marker> = new Map();

  totalVehicles = 0;
  activeVehiclesCount = 0;
  idleVehiclesCount = 0;
  maintenanceVehiclesCount = 0;
  
  constructor(private transportService: TransportService, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.loadInitialVehicles();
    this.connectWebSocket();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.ngZone.runOutsideAngular(() => {
      this.map = L.map(this.mapContainer.nativeElement).setView([36.8065, 10.1815], 12);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
      }).addTo(this.map);

      if (this.vehicles.length > 0) {
        this.updateMarkers();
      }
    });
  }

  loadInitialVehicles() {
    this.isLoading = true;
    this.transportService.getActiveVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.computeStats();
        if (this.map) {
          this.updateMarkers();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load active vehicles', err);
        this.isLoading = false;
      }
    });
  }

  connectWebSocket() {
    this.connectionState = 'connecting';
    
    let baseUrl = environment.readinessTransportApiUrl;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 4);
    }
    const wsUrl = baseUrl + '/ws';
    
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      this.ngZone.run(() => {
        this.connectionState = 'connected';
      });
      this.stompClient?.subscribe('/topic/fleet/vehicles', (message: IMessage) => {
        if (message.body) {
           this.ngZone.run(() => {
             this.handleWebSocketMessage(JSON.parse(message.body));
           });
        }
      });
    };

    this.stompClient.onWebSocketError = () => {
      this.ngZone.run(() => {
        this.connectionState = 'disconnected';
      });
    };

    this.stompClient.onWebSocketClose = () => {
      this.ngZone.run(() => {
        this.connectionState = 'disconnected';
      });
    };

    this.stompClient.activate();
  }

  handleWebSocketMessage(data: any) {
    if (Array.isArray(data)) {
      data.forEach(incVehicle => this.updateOrAddVehicle(incVehicle));
    } else {
      this.updateOrAddVehicle(data);
    }
    this.computeStats();
  }

  private getMarkerColor(status: string): string {
    switch(status) {
      case 'ON_ROUTE': return '#10B981'; // Green
      case 'ASSIGNED': return '#3B82F6'; // Blue
      case 'MAINTENANCE': return '#EF4444'; // Red
      default: return '#9CA3AF'; // Gray for IDLE or unknown
    }
  }

  updateOrAddVehicle(incVehicle: any) {
    if (incVehicle.vehicleId && !incVehicle.id) {
       incVehicle.id = incVehicle.vehicleId;
    }
    
    if (!incVehicle.id && !incVehicle.code) return;
    
    const index = this.vehicles.findIndex(v => 
      (incVehicle.id && v.id === incVehicle.id) || 
      (incVehicle.code && v.code === incVehicle.code)
    );
     
    let vId = incVehicle.id || incVehicle.code;
    let fullVehicle: Vehicle;

    if (index !== -1) {
       this.vehicles[index] = { ...this.vehicles[index], ...incVehicle };
       fullVehicle = this.vehicles[index];
    } else if (incVehicle.code) {
       this.vehicles.push(incVehicle as Vehicle);
       fullVehicle = incVehicle as Vehicle;
    } else {
       return;
    }

    if (this.map && fullVehicle.currentLat && fullVehicle.currentLng) {
      const lat = fullVehicle.currentLat;
      const lng = fullVehicle.currentLng;
      
      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; padding: 4px;">
          <strong style="display: block; font-size: 14px; margin-bottom: 4px;">${fullVehicle.code}</strong>
          <span style="font-size: 12px; color: #6b7280; display: block;">Capacity: ${fullVehicle.capacity} seats</span>
          <span style="font-size: 12px; font-weight: 600; color: ${this.getMarkerColor(fullVehicle.status)};">${fullVehicle.status}</span>
        </div>
      `;

      if (this.markersMap.has(vId)) {
        const m = this.markersMap.get(vId)!;
        m.setLatLng([lat, lng]);
        m.getPopup()?.setContent(popupContent);
        
        // Update color if status changed by rebuilding icon
        const iconHtml = `<div style="width:16px; height:16px; background-color:${this.getMarkerColor(fullVehicle.status)}; border:2px solid white; border-radius:50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`;
        m.setIcon(L.divIcon({ html: iconHtml, className: '', iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10] }));
      } else {
        const iconHtml = `<div style="width:16px; height:16px; background-color:${this.getMarkerColor(fullVehicle.status)}; border:2px solid white; border-radius:50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          popupAnchor: [0, -10]
        });
        
        const m = L.marker([lat, lng], {icon: customIcon}).bindPopup(popupContent);
        m.addTo(this.map);
        this.markersMap.set(vId, m);
      }
    }
  }

  updateMarkers() {
    this.vehicles.forEach(v => {
      if(v.id || v.code) this.updateOrAddVehicle(v);
    });
  }

  computeStats() {
    this.totalVehicles = this.vehicles.length;
    this.activeVehiclesCount = this.vehicles.filter(v => v.status === 'ON_ROUTE' || v.status === 'ASSIGNED').length;
    this.idleVehiclesCount = this.vehicles.filter(v => v.status === 'IDLE').length;
    this.maintenanceVehiclesCount = this.vehicles.filter(v => v.status === 'MAINTENANCE').length;
  }

  viewOnMap(lat: number | undefined, lng: number | undefined) {
    if (this.map && lat !== undefined && lng !== undefined) {
      this.map.flyTo([lat, lng], 15, { animate: true, duration: 1.0 });
    }
  }

  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  selectVehicle(id: string) {
    this.selectedVehicleId = id;
    const v = this.vehicles.find(v => v.id === id);
    if (v && v.currentLat && v.currentLng) {
      this.viewOnMap(v.currentLat, v.currentLng);
    }
  }

  recenterMap() {
    if (this.map && this.vehicles.length > 0) {
      const active = this.vehicles.filter(v => !!v.currentLat);
      if (active.length > 0) {
          // just pick first for now or compute center
          this.viewOnMap(active[0].currentLat, active[0].currentLng);
      }
    }
  }

  toggleHeatmap() {
    console.log('Heatmap toggle - Stub');
  }

  refreshFleet() {
    this.loadInitialVehicles();
  }
}
