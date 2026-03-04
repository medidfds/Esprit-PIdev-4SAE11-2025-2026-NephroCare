package esprit.pharmacy_service.repository;

import esprit.pharmacy_service.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicationRepository extends JpaRepository<Medication, String> {
    Optional<Medication> findByMedicationNameIgnoreCase(String medicationName);
    List<Medication> findByUserId(String userId);



}
