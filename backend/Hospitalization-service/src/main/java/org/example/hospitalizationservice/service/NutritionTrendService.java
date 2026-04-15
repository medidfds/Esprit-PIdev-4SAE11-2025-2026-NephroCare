// NutritionTrendService.java feature 4 Weekly trend
package org.example.hospitalizationservice.service;

import lombok.RequiredArgsConstructor;
import org.example.hospitalizationservice.entities.NutritionPlan;
import org.example.hospitalizationservice.enums.NutritionTrend;
import org.example.hospitalizationservice.repository.NutritionPlanRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NutritionTrendService {

    private final NutritionSummaryService summaryService;
    private final NutritionPlanRepository nutritionPlanRepository;

    public Map<String, Object> getWeeklyTrendAndPersist(NutritionPlan plan) {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> points = new ArrayList<>();
        List<Double> overallPerDay = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Map<String, Object> summary = summaryService.getDailySummary(plan, date);

            @SuppressWarnings("unchecked")
            Map<String, Double> ach = (Map<String, Double>) summary.get("achievementPct");
            double overall = ach.values().stream().mapToDouble(Double::doubleValue).average().orElse(0);
            overallPerDay.add(overall);

            @SuppressWarnings("unchecked")
            Map<String, Integer> consumed = (Map<String, Integer>) summary.get("consumed");

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date",              date.toString());
            point.put("calories",          consumed.get("calories"));
            point.put("proteinG",          consumed.get("proteinG"));
            point.put("carbsG",            consumed.get("carbsG"));
            point.put("fatG",              consumed.get("fatG"));
            point.put("overallAchievement", Math.round(overall * 10) / 10.0);
            points.add(point);
        }

        NutritionTrend trend = computeTrend(overallPerDay);

        // Persist so GET /plan/{id} reflects latest trend
        plan.setTrend(trend);
        nutritionPlanRepository.save(plan);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("trend",  trend);
        result.put("points", points);
        return result;
    }

    private NutritionTrend computeTrend(List<Double> points) {
        int mid = points.size() / 2;
        double firstHalf  = points.subList(0, mid).stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double secondHalf = points.subList(mid, points.size()).stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double delta = secondHalf - firstHalf;
        if      (delta >  8) return NutritionTrend.IMPROVING;
        else if (delta < -8) return NutritionTrend.DECLINING;
        else                 return NutritionTrend.STABLE;
    }
}