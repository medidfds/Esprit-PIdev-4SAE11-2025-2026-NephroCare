import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Important for [(ngModel)]
import { Router } from '@angular/router';
import { DialysisService } from '../../../shared/services/dialysis.service';
import { DialysisTreatment } from '../../../shared/models/dialysis.model';

@Component({
    selector: 'app-treatment-list',
    standalone: true,
    imports: [CommonModule, FormsModule], // Import FormsModule here
    templateUrl: './treatment-list.component.html',
})
export class TreatmentListComponent implements OnInit {
    treatments: DialysisTreatment[] = [];

    // Modal State
    isModalOpen = false;
    modalMode: 'add' | 'edit' = 'add';

    // Form Data
    formData: Partial<DialysisTreatment> = {};

    constructor(private service: DialysisService, private router: Router) {}

    ngOnInit(): void {
        this.loadTreatments();
    }

    loadTreatments(): void {
        this.service.getTreatments().subscribe(data => this.treatments = data);
    }

    // --- Modal Logic ---
    openAddModal(): void {
        this.modalMode = 'add';
        this.formData = {
            dialysisType: 'HEMODIALYSIS',
            vascularAccessType: 'AV_FISTULA',
            frequencyPerWeek: 3,
            prescribedDurationMinutes: 240,
            targetDryWeight: 70,
            startDate: new Date().toISOString().split('T')[0] // Default to today
        };
        this.isModalOpen = true;
    }

    openEditModal(t: DialysisTreatment): void {
        this.modalMode = 'edit';
        // Clone object to avoid editing the table directly
        this.formData = { ...t };
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
    }

    // --- CRUD Actions ---
    onSubmit(): void {
        if (this.modalMode === 'add') {
            this.service.addTreatment(this.formData as DialysisTreatment).subscribe(() => {
                this.closeModal();
                this.loadTreatments();
            });
        } else {
            // Update
            this.service.updateTreatment(this.formData.id!, this.formData as DialysisTreatment).subscribe(() => {
                this.closeModal();
                this.loadTreatments();
            });
        }
    }

    deleteTreatment(id: string): void {
        if (confirm('Are you sure you want to delete this treatment?')) {
            this.service.deleteTreatment(id).subscribe(() => this.loadTreatments());
        }
    }

    suspendTreatment(id: string): void {
        const reason = prompt('Enter reason for suspension:');
        if (reason) {
            this.service.suspendTreatment(id, reason).subscribe(() => this.loadTreatments());
        }
    }

    // --- Navigation ---
    viewSessions(treatmentId: string): void {
        this.router.navigate(['/dialysis/sessions', treatmentId]);
    }
}