package org.example.hospitalizationservice.service;

import org.example.hospitalizationservice.entities.MealRecord;
import org.example.hospitalizationservice.entities.NutritionPlan;
import org.example.hospitalizationservice.enums.DietType;
import org.example.hospitalizationservice.enums.MealType;
import org.example.hospitalizationservice.repository.MealRecordRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionSummaryServiceTest {

    @Mock
    private MealRecordRepository mealRecordRepository;

    @InjectMocks
    private NutritionSummaryService nutritionSummaryService;

    @Test
    void getDailySummary_computesWeightedConsumptionAndRecommendations() {
        NutritionPlan plan = new NutritionPlan();
        plan.setDietType(DietType.STANDARD);
        plan.setTargetCalories(2000);
        plan.setTargetProteinG(100);
        plan.setTargetCarbsG(200);
        plan.setTargetFatG(100);

        LocalDate date = LocalDate.of(2026, 4, 16);
        MealRecord breakfast = meal(
                MealType.BREAKFAST,
                LocalDateTime.of(2026, 4, 16, 8, 0),
                600, 20, 80, 40, 50
        );
        MealRecord lunch = meal(
                MealType.LUNCH,
                LocalDateTime.of(2026, 4, 16, 13, 0),
                800, 30, 120, 70, 100
        );

        when(mealRecordRepository.findByPlanAndDate(plan, date)).thenReturn(List.of(breakfast, lunch));

        Map<String, Object> result = nutritionSummaryService.getDailySummary(plan, date);

        @SuppressWarnings("unchecked")
        Map<String, Integer> consumed = (Map<String, Integer>) result.get("consumed");
        @SuppressWarnings("unchecked")
        Map<String, Double> achievement = (Map<String, Double>) result.get("achievementPct");
        @SuppressWarnings("unchecked")
        List<String> recommendations = (List<String>) result.get("recommendations");

        assertThat(consumed).containsEntry("calories", 1100);
        assertThat(consumed).containsEntry("proteinG", 40);
        assertThat(consumed).containsEntry("carbsG", 160);
        assertThat(consumed).containsEntry("fatG", 90);
        assertThat(achievement).containsEntry("calories", 55.0);
        assertThat(achievement).containsEntry("protein", 40.0);
        assertThat(achievement).containsEntry("carbs", 80.0);
        assertThat(achievement).containsEntry("fat", 90.0);
        assertThat(recommendations)
                .contains("Caloric intake critically low — consider nutritional supplements")
                .contains("Protein intake insufficient — may delay wound healing");
        verify(mealRecordRepository).findByPlanAndDate(plan, date);
    }

    private MealRecord meal(
            MealType mealType,
            LocalDateTime recordedAt,
            int calories,
            int protein,
            int carbs,
            int fat,
            int consumptionPercent
    ) {
        MealRecord meal = new MealRecord();
        meal.setMealType(mealType);
        meal.setRecordedAt(recordedAt);
        meal.setCalories(calories);
        meal.setProteinG(protein);
        meal.setCarbsG(carbs);
        meal.setFatG(fat);
        meal.setConsumptionPercent(consumptionPercent);
        return meal;
    }
}
