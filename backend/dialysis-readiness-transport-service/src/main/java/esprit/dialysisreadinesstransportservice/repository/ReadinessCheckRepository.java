package esprit.dialysisreadinesstransportservice.repository;

import esprit.dialysisreadinesstransportservice.entity.ReadinessCheck;
import esprit.dialysisreadinesstransportservice.enums.ReadinessStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadinessCheckRepository extends JpaRepository<ReadinessCheck, UUID> {
    Optional<ReadinessCheck> findByScheduledSessionId(UUID scheduledSessionId);
    List<ReadinessCheck> findByReadinessStatus(ReadinessStatus readinessStatus);
    List<ReadinessCheck> findByPatientId(UUID patientId);
}
