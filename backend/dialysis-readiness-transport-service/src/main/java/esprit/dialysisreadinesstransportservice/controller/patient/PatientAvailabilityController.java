package esprit.dialysisreadinesstransportservice.controller.patient;

import esprit.dialysisreadinesstransportservice.dto.availability.PatientAvailabilityResponseDto;
import esprit.dialysisreadinesstransportservice.dto.availability.PatientAvailabilityResponseRequest;
import esprit.dialysisreadinesstransportservice.service.availability.PatientAvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/patient/availability")
@RequiredArgsConstructor
public class PatientAvailabilityController {

    private final PatientAvailabilityService service;

    @GetMapping("/{scheduledSessionId}")
    public ResponseEntity<PatientAvailabilityResponseDto> getAvailability(@PathVariable UUID scheduledSessionId) {
        return ResponseEntity.ok(service.getByScheduledSessionId(scheduledSessionId));
    }

    @PutMapping("/{scheduledSessionId}/response")
    public ResponseEntity<PatientAvailabilityResponseDto> respondToSession(
            @PathVariable UUID scheduledSessionId,
            @RequestBody PatientAvailabilityResponseRequest request) {
        return ResponseEntity.ok(service.respond(scheduledSessionId, request));
    }
}
