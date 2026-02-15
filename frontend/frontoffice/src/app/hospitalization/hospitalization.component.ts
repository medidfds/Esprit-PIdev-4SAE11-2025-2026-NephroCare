import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HospitalizationService } from '../services/hospitalization.service';

@Component({
  selector: 'app-hospitalization',
  standalone: false,
  templateUrl: './hospitalization.component.html',
  styleUrls: ['./hospitalization.component.css']
})
export class HospitalizationComponent implements OnInit {

  hospitalizations: any[] = [];
  filteredHospitalizations: any[] = [];   // ✅ REQUIRED
  form: FormGroup;
  editingId: number | null = null;
  searchTerm: string = '';

  constructor(
    private service: HospitalizationService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      admissionDate: [''],
      dischargeDate: [''],
      roomNumber: [''],
      admissionReason: [''],
      status: [''],
      userId: [''],
      attendingDoctorId: ['']
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  // ✅ Load all hospitalizations
  loadAll() {
    this.service.getAll().subscribe({
      next: (data: any[]) => {
        console.log("Backend data:", data);
        this.hospitalizations = data || [];
        this.filterHospitalizations(); // 🔹 call filter here
      },
      error: err => console.error('Error loading hospitalizations', err)
    });
  }


  // ✅ Save (create or update)
  save() {

    const hospitalization = {
      ...this.form.value,
      admissionDate: this.form.value.admissionDate
        ? this.form.value.admissionDate + ':00'
        : null,
      dischargeDate: this.form.value.dischargeDate
        ? this.form.value.dischargeDate + ':00'
        : null
    };

    if (this.editingId) {
      this.service.update(this.editingId, hospitalization).subscribe({
        next: () => {
          this.loadAll();
          this.cancel();
        },
        error: err => console.error(err)
      });
    } else {
      this.service.create(hospitalization).subscribe({
        next: () => {
          this.loadAll();
          this.cancel();
        },
        error: err => console.error(err)
      });
    }
  }

  // ✅ Edit
  edit(h: any) {
    this.editingId = h.id;
    this.form.patchValue({
      ...h,
      admissionDate: this.formatDateForInput(h.admissionDate),
      dischargeDate: this.formatDateForInput(h.dischargeDate)
    });
  }

  // ✅ Delete
  delete(id?: number) {
    if (!id) return;

    this.service.delete(id).subscribe({
      next: () => this.loadAll(),
      error: err => console.error('Error deleting hospitalization', err)
    });
  }

  // ✅ Cancel
  cancel() {
    this.editingId = null;
    this.form.reset();
  }

  // ✅ Search filter (SAFE)
  filterHospitalizations() {
    const term = this.searchTerm?.toLowerCase() || '';

    this.filteredHospitalizations = this.hospitalizations.filter(h =>
      !term || // if term is empty, keep all
      (h.roomNumber || '').toLowerCase().includes(term) ||
      (h.admissionReason || '').toLowerCase().includes(term) ||
      (h.status || '').toLowerCase().includes(term) ||
      String(h.userId || '').toLowerCase().includes(term) ||
      String(h.attendingDoctorId || '').toLowerCase().includes(term)
    );
  }


  // ✅ Format date for datetime-local input
  private formatDateForInput(date: string | null): string | null {
    if (!date) return null;
    return date.substring(0, 16); // "2026-02-14T10:00"
  }
}
