package esprit.dialysisreadinesstransportservice.repository;

import esprit.dialysisreadinesstransportservice.entity.PatientAvailability;
import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientAvailabilityRepository extends JpaRepository<PatientAvailability, UUID> {
    Optional<PatientAvailability> findByScheduledSessionId(UUID scheduledSessionId);
    List<PatientAvailability> findByAvailabilityStatus(AvailabilityStatus availabilityStatus);
    List<PatientAvailability> findByPatientId(UUID patientId);
}
