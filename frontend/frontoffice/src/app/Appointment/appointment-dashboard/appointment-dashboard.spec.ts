import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentDashboard } from './appointment-dashboard';

describe('AppointmentDashboard', () => {
  let component: AppointmentDashboard;
  let fixture: ComponentFixture<AppointmentDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppointmentDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
