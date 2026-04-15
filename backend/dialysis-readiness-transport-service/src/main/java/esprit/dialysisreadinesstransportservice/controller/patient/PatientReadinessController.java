package esprit.dialysisreadinesstransportservice.controller.patient;

import esprit.dialysisreadinesstransportservice.dto.readiness.ReadinessResponseDto;
import esprit.dialysisreadinesstransportservice.service.readiness.ReadinessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/patient/readiness")
@RequiredArgsConstructor
public class PatientReadinessController {

    private final ReadinessService service;

    @GetMapping("/{scheduledSessionId}")
    public ResponseEntity<ReadinessResponseDto> getReadiness(@PathVariable UUID scheduledSessionId) {
        return ResponseEntity.ok(service.getByScheduledSessionId(scheduledSessionId));
    }
}
