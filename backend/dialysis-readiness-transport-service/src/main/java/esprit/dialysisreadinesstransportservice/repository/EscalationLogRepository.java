package esprit.dialysisreadinesstransportservice.repository;

import esprit.dialysisreadinesstransportservice.entity.EscalationLog;
import esprit.dialysisreadinesstransportservice.enums.EscalationLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EscalationLogRepository extends JpaRepository<EscalationLog, UUID> {
    boolean existsByScheduledSessionIdAndLevel(UUID scheduledSessionId, EscalationLevel level);
    List<EscalationLog> findByScheduledSessionId(UUID scheduledSessionId);
}
