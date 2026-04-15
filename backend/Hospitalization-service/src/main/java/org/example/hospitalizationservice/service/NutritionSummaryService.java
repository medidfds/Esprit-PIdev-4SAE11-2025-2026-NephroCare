// NutritionSummaryService.java feature 2 Daily summary
package org.example.hospitalizationservice.service;

import lombok.RequiredArgsConstructor;
import org.example.hospitalizationservice.entities.MealRecord;
import org.example.hospitalizationservice.entities.NutritionPlan;
import org.example.hospitalizationservice.repository.MealRecordRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NutritionSummaryService {

    private final MealRecordRepository mealRecordRepository;

    /**
     * Returns a plain Map so the controller can return it directly as JSON
     * without any DTO class. All computation stays here.
     */
    public Map<String, Object> getDailySummary(NutritionPlan plan, LocalDate date) {
        List<MealRecord> meals = mealRecordRepository.findByPlanAndDate(plan, date);

        int calories = meals.stream().mapToInt(m -> weighted(m.getCalories(), m.getConsumptionPercent())).sum();
        int protein  = meals.stream().mapToInt(m -> weighted(m.getProteinG(),  m.getConsumptionPercent())).sum();
        int carbs    = meals.stream().mapToInt(m -> weighted(m.getCarbsG(),    m.getConsumptionPercent())).sum();
        int fat      = meals.stream().mapToInt(m -> weighted(m.getFatG(),      m.getConsumptionPercent())).sum();

        Map<String, Object> consumed = new LinkedHashMap<>();
        consumed.put("calories", calories);
        consumed.put("proteinG", protein);
        consumed.put("carbsG",   carbs);
        consumed.put("fatG",     fat);

        Map<String, Double> achievement = new LinkedHashMap<>();
        achievement.put("calories", pct(calories, plan.getTargetCalories()));
        achievement.put("protein",  pct(protein,  plan.getTargetProteinG()));
        achievement.put("carbs",    pct(carbs,    plan.getTargetCarbsG()));
        achievement.put("fat",      pct(fat,      plan.getTargetFatG()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date",            date.toString());
        result.put("consumed",        consumed);
        result.put("achievementPct",  achievement);
        result.put("meals",           meals);
        result.put("recommendations", buildRecommendations(achievement));
        return result;
    }

    public List<String> buildRecommendations(Map<String, Double> achievement) {
        List<String> recs = new ArrayList<>();
        if (achievement.get("calories") < 70) recs.add("Caloric intake critically low — consider nutritional supplements");
        if (achievement.get("protein")  < 60) recs.add("Protein intake insufficient — may delay wound healing");
        if (achievement.get("carbs")   > 130) recs.add("Carbohydrate intake exceeds target — monitor blood glucose");
        if (achievement.get("fat")     > 130) recs.add("Fat intake exceeds target — review meal composition");
        return recs;
    }

    // Weighted by how much was actually consumed
    private int    weighted(int value, int pct) { return (int) Math.round(value * pct / 100.0); }
    public  double pct(int actual, int target)  { return target == 0 ? 0 : Math.round(actual * 1000.0 / target) / 10.0; }
}