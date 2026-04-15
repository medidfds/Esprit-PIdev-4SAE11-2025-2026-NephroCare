package org.example.hospitalizationservice.repository;

import org.example.hospitalizationservice.entities.NutritionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NutritionPlanRepository extends JpaRepository<NutritionPlan, Long> {

    // ✅ No @Query needed anymore.
    //    Because NutritionPlan now has a direct `hospitalizationId` Long field,
    //    Spring Data resolves these as plain column lookups:
    //      WHERE hospitalization_id = ?
    //    instead of the JOIN that JPQL path traversal was generating before.
    Optional<NutritionPlan> findByHospitalizationId(Long hospitalizationId);

    boolean existsByHospitalizationId(Long hospitalizationId);
}