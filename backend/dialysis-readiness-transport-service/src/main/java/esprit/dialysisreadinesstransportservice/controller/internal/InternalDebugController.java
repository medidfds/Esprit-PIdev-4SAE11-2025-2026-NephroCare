package esprit.dialysisreadinesstransportservice.controller.internal;

import esprit.dialysisreadinesstransportservice.dto.common.ApiMessageResponse;
import esprit.dialysisreadinesstransportservice.dto.event.ScheduledSessionConfirmedEvent;
import esprit.dialysisreadinesstransportservice.entity.EscalationLog;
import esprit.dialysisreadinesstransportservice.entity.PatientAvailability;
import esprit.dialysisreadinesstransportservice.entity.ReadinessCheck;
import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.messaging.publisher.ScheduledSessionEventPublisher;
import esprit.dialysisreadinesstransportservice.repository.EscalationLogRepository;
import esprit.dialysisreadinesstransportservice.repository.PatientAvailabilityRepository;
import esprit.dialysisreadinesstransportservice.repository.ReadinessCheckRepository;
import esprit.dialysisreadinesstransportservice.repository.TransportRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal/debug")
@RequiredArgsConstructor
public class InternalDebugController {

    private final ScheduledSessionEventPublisher publisher;
    private final PatientAvailabilityRepository availabilityRepository;
    private final ReadinessCheckRepository readinessRepository;
    private final TransportRequestRepository transportRepository;
    private final EscalationLogRepository escalationLogRepository;

    @PostMapping("/publish-session-confirmed")
    public ResponseEntity<ApiMessageResponse> publishSessionConfirmed(@RequestBody ScheduledSessionConfirmedEvent event) {
        publisher.publishScheduledSessionConfirmed(event);
        return ResponseEntity.ok(ApiMessageResponse.builder()
                .message("Test event successfully published to RabbitMQ.")
                .build());
    }

    @GetMapping("/availability/{scheduledSessionId}")
    public ResponseEntity<PatientAvailability> getAvailability(@PathVariable UUID scheduledSessionId) {
        return availabilityRepository.findByScheduledSessionId(scheduledSessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/readiness/{scheduledSessionId}")
    public ResponseEntity<ReadinessCheck> getReadiness(@PathVariable UUID scheduledSessionId) {
        return readinessRepository.findByScheduledSessionId(scheduledSessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/transport/{scheduledSessionId}")
    public ResponseEntity<TransportRequest> getTransport(@PathVariable UUID scheduledSessionId) {
        return transportRepository.findByScheduledSessionId(scheduledSessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/escalations/{scheduledSessionId}")
    public ResponseEntity<List<EscalationLog>> getEscalations(@PathVariable UUID scheduledSessionId) {
        return ResponseEntity.ok(escalationLogRepository.findByScheduledSessionId(scheduledSessionId));
    }
}
