package esprit.dialysisreadinesstransportservice.service.readiness;

import esprit.dialysisreadinesstransportservice.dto.readiness.ReadinessResponseDto;
import java.util.List;
import java.util.UUID;

public interface ReadinessService {
    List<ReadinessResponseDto> getAllReadinessChecks();
    ReadinessResponseDto getByScheduledSessionId(UUID scheduledSessionId);
    ReadinessResponseDto recompute(UUID scheduledSessionId);
}
