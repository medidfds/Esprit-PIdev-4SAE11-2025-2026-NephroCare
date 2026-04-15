// NutritionRiskService.java feature 3  Risk assessment
package org.example.hospitalizationservice.service;

import lombok.RequiredArgsConstructor;
import org.example.hospitalizationservice.entities.MealRecord;
import org.example.hospitalizationservice.entities.NutritionPlan;
import org.example.hospitalizationservice.enums.NutritionRiskLevel;
import org.example.hospitalizationservice.repository.MealRecordRepository;
import org.example.hospitalizationservice.repository.NutritionPlanRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NutritionRiskService {

    private static final double LOW_THRESHOLD  = 60.0;
    private static final int    LOOKBACK_DAYS  = 7;

    private final MealRecordRepository    mealRecordRepository;
    private final NutritionPlanRepository nutritionPlanRepository;
    private final NutritionSummaryService summaryService;

    /**
     * Computes risk, persists it on the plan, and returns a plain Map for the controller.
     */
    public Map<String, Object> assessAndPersist(NutritionPlan plan) {
        LocalDate today = LocalDate.now();
        List<Double> dailyCaloriePcts = new ArrayList<>();

        for (int i = 0; i < LOOKBACK_DAYS; i++) {
            Map<String, Object> summary = summaryService.getDailySummary(plan, today.minusDays(i));
            @SuppressWarnings("unchecked")
            Map<String, Double> ach = (Map<String, Double>) summary.get("achievementPct");
            dailyCaloriePcts.add(ach.get("calories"));
        }

        double avg = dailyCaloriePcts.stream().mapToDouble(Double::doubleValue).average().orElse(100);

        int consecutiveLow = 0;
        for (double p : dailyCaloriePcts) {
            if (p < LOW_THRESHOLD) consecutiveLow++;
            else break;
        }

        List<String> triggers = new ArrayList<>();
        NutritionRiskLevel risk;

        if      (consecutiveLow >= 5 || avg < 40) { risk = NutritionRiskLevel.CRITICAL; triggers.add("5+ consecutive days below 60% caloric intake"); }
        else if (consecutiveLow >= 3 || avg < 55) { risk = NutritionRiskLevel.HIGH;     triggers.add("3+ consecutive days of poor intake"); }
        else if (consecutiveLow >= 1 || avg < 70) { risk = NutritionRiskLevel.MODERATE; triggers.add("Consecutive days below caloric target"); }
        else                                       { risk = NutritionRiskLevel.NORMAL; }

        if (avg < 50) triggers.add("Average caloric achievement below 50% over 7 days");

        // Persist so GET /plan/{id} always reflects latest risk
        plan.setRiskLevel(risk);
        nutritionPlanRepository.save(plan);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("riskLevel",              risk);
        result.put("consecutiveLowDays",     consecutiveLow);
        result.put("averageCalorieAchievement", Math.round(avg * 10) / 10.0);
        result.put("triggers",               triggers);
        return result;
    }
}