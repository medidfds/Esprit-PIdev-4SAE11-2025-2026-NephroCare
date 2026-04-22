package esprit.dialysisreadinesstransportservice.client;

import esprit.dialysisreadinesstransportservice.dto.client.AlertRequestDTO;
import esprit.dialysisreadinesstransportservice.dto.client.ScheduledSessionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DialysisServiceClient {

    private final DialysisServiceFeignClient dialysisServiceFeignClient;

    /**
     * Fetches a scheduled session by ID from dialysis-service.
     */
    public Optional<ScheduledSessionDto> getScheduledSession(UUID scheduledSessionId) {
        try {
            ScheduledSessionDto dto = dialysisServiceFeignClient.getScheduledSession(scheduledSessionId);
            return Optional.ofNullable(dto);
        } catch (Exception e) {
            log.warn("Failed to fetch scheduled session {} from dialysis-service: {}", scheduledSessionId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Pushes a new alert to the dialysis-service alert hub.
     */
    public void createAlert(AlertRequestDTO dto) {
        try {
            dialysisServiceFeignClient.createAlert(dto);
        } catch (Exception e) {
            log.error("Failed to push alert for patient {}: {}", dto.getPatientId(), e.getMessage());
        }
    }
}
