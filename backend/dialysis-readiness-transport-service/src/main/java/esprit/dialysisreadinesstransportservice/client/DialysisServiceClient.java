package esprit.dialysisreadinesstransportservice.client;

import esprit.dialysisreadinesstransportservice.dto.client.AlertRequestDTO;
import esprit.dialysisreadinesstransportservice.dto.client.ScheduledSessionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DialysisServiceClient {

    private final RestTemplate restTemplate;

    @Value("${dialysis-service.base-url:http://localhost:8075}")
    private String dialysisBaseUrl;

    /**
     * Fetches a scheduled session by ID from dialysis-service.
     */
    public Optional<ScheduledSessionDto> getScheduledSession(UUID scheduledSessionId) {
        try {
            String url = dialysisBaseUrl + "/api/schedule/internal/" + scheduledSessionId;
            ScheduledSessionDto dto = restTemplate.getForObject(url, ScheduledSessionDto.class);
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
            String url = dialysisBaseUrl + "/api/alerts/internal";
            restTemplate.postForObject(url, dto, Void.class);
        } catch (Exception e) {
            log.error("Failed to push alert for patient {}: {}", dto.getPatientId(), e.getMessage());
        }
    }
}
