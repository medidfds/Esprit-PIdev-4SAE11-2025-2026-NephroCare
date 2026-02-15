import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DialysisService } from '../../../shared/services/dialysis.service';
import { DialysisSession } from '../../../shared/models/dialysis.model';
import {SlicePipe} from "@angular/common";
import {FormsModule} from "@angular/forms";
import { CommonModule } from '@angular/common';  // ✅ AJOUTEZ CECI


@Component({
    selector: 'app-session-list',
    templateUrl: './session-list.component.html',
    imports: [
        SlicePipe,
        FormsModule,
        CommonModule
    ],
})
export class SessionListComponent implements OnInit {
    sessions: DialysisSession[] = [];
    treatmentId: string = '';

    // Modal State
    isModalOpen = false;
    selectedSession: DialysisSession | null = null;

    // Form Inputs
    weightAfter: number = 0;
    preUrea: number = 0;
    postUrea: number = 0;

    constructor(private service: DialysisService, private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.treatmentId = this.route.snapshot.paramMap.get('id') || '';
        this.loadSessions();
    }

    loadSessions(): void {
        this.service.getSessionsByTreatment(this.treatmentId).subscribe(data => this.sessions = data);
    }

    openEndModal(session: DialysisSession): void {
        this.selectedSession = session;
        this.weightAfter = session.weightAfter || 0;
        this.isModalOpen = true;
    }

    submitEndSession(): void {
        if (!this.selectedSession) return;

        // We construct a single object to match the Service signature
        const data = {
            weightAfter: this.weightAfter,
            postDialysisUrea: this.postUrea,
            preDialysisUrea: this.preUrea
        };

        this.service.endSession(this.selectedSession.id, data).subscribe({
            next: (res) => {
                console.log('Session ended, Kt/V calculated:', res);
                this.isModalOpen = false;
                this.loadSessions(); // Refresh list
            },
            error: (err) => console.error(err)
        });
    }
}