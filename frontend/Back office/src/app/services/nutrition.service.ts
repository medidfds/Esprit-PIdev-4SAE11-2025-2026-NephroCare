// src/app/services/nutrition.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NutritionPlan {
  id?:                number;
  dietType:           string;
  targetCalories:     number;
  targetProteinG:     number;
  targetCarbsG:       number;
  targetFatG:         number;
  notes?:             string;
  prescribedBy?:      string;
  createdAt?:         string;
  riskLevel?:         string;
  trend?:             string;
  hospitalizationId?: number;
}

export interface MealRecord {
  id?:                number;
  mealType:           string;
  recordedAt?:        string;
  calories:           number;
  proteinG:           number;
  carbsG:             number;
  fatG:               number;
  consumptionPercent: number;
  notes?:             string;
  recordedBy?:        string;
}

export interface DailySummary {
  date:            string;
  consumed:        { calories: number; proteinG: number; carbsG: number; fatG: number };
  achievementPct:  { calories: number; protein: number; carbs: number; fat: number };
  meals:           MealRecord[];
  recommendations: string[];
}

export interface RiskAssessment {
  riskLevel:                 string;
  consecutiveLowDays:        number;
  averageCalorieAchievement: number;
  triggers:                  string[];
}

export interface WeeklyTrend {
  trend:  string;
  points: {
    date:               string;
    calories:           number;
    proteinG:           number;
    carbsG:             number;
    fatG:               number;
    overallAchievement: number;
  }[];
}

// ✅ Lightweight shape — only the 4 fields the nutrition module needs.
//    Old: GET /api/hospitalizations/{id}  → returned full Hospitalization
//         + @JsonManagedReference vitalSignsRecords  → extra VitalSigns SELECT
//         + @JsonManagedReference nutritionPlan      → extra NutritionPlan SELECT
//    New: GET /api/nutrition/hosp-info/{id} → returns {id, userId, admissionReason, status} only
export interface HospitalizationInfo {
  id:              number;
  userId:          string;
  admissionReason: string;
  status:          string;
}

@Injectable({ providedIn: 'root' })
export class NutritionService {

  private readonly base = 'http://localhost:8070/hospitalization/api/nutrition';

  constructor(private http: HttpClient) {}

  // ── Lightweight hospitalization lookup ────────────────────────────────
  getHospitalization(id: number): Observable<HospitalizationInfo> {
    return this.http.get<HospitalizationInfo>(`${this.base}/hosp-info/${id}`);
  }

  reCalculatePlan(hospitalizationId: number): Observable<NutritionPlan> {
    return this.http.put<NutritionPlan>(`${this.base}/plan/suggest/${hospitalizationId}`, {});
  } 

  // ── Plan ──────────────────────────────────────────────────────────────
  suggestAndCreate(hospitalizationId: number): Observable<NutritionPlan> {
    return this.http.post<NutritionPlan>(`${this.base}/plan/suggest/${hospitalizationId}`, {});
  }

  getPlan(hospitalizationId: number): Observable<NutritionPlan> {
    return this.http.get<NutritionPlan>(`${this.base}/plan/${hospitalizationId}`);
  }

  updatePlan(planId: number, plan: Partial<NutritionPlan>): Observable<NutritionPlan> {
    return this.http.put<NutritionPlan>(`${this.base}/plan/${planId}`, plan);
  }

  // ── Feature 2 ─────────────────────────────────────────────────────────
  getDailySummary(planId: number, date?: string): Observable<DailySummary> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<DailySummary>(`${this.base}/plan/${planId}/summary`, { params });
  }

  // ── Feature 3 ─────────────────────────────────────────────────────────
  getRisk(planId: number): Observable<RiskAssessment> {
    return this.http.get<RiskAssessment>(`${this.base}/plan/${planId}/risk`);
  }

  // ── Feature 4 ─────────────────────────────────────────────────────────
  getWeeklyTrend(planId: number): Observable<WeeklyTrend> {
    return this.http.get<WeeklyTrend>(`${this.base}/plan/${planId}/trend`);
  }

  // ── Meals ─────────────────────────────────────────────────────────────
  getMeals(planId: number): Observable<MealRecord[]> {
    return this.http.get<MealRecord[]>(`${this.base}/plan/${planId}/meals`);
  }

  addMeal(planId: number, meal: MealRecord): Observable<MealRecord> {
    return this.http.post<MealRecord>(`${this.base}/plan/${planId}/meals`, meal);
  }

  deleteMeal(mealId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/meals/${mealId}`);
  }
}