package esprit.dialysisservice.repositories;

import esprit.dialysisservice.entities.DialysisSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DialysisSessionRepository extends JpaRepository<DialysisSession, UUID> {
    // Get history for a specific treatment plan
    List<DialysisSession> findByTreatmentId(UUID treatmentId);
    // Custom query to find sessions by the patient_id inside the parent treatment table
    @Query("SELECT s FROM DialysisSession s WHERE s.treatment.patientId = :patientId")
    List<DialysisSession> findByTreatmentPatientId(@Param("patientId") UUID patientId);
}