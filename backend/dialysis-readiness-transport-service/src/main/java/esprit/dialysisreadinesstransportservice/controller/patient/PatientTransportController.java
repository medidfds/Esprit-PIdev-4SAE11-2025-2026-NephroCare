package esprit.dialysisreadinesstransportservice.controller.patient;

import esprit.dialysisreadinesstransportservice.dto.transport.TransportRequestResponseDto;
import esprit.dialysisreadinesstransportservice.exception.ResourceNotFoundException;
import esprit.dialysisreadinesstransportservice.service.transport.TransportRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/patient/transport")
@RequiredArgsConstructor
public class PatientTransportController {

    private final TransportRequestService service;

    /**
     * Returns the transport request linked to a scheduled session.
     * Returns 404 if no transport request was created (patient never requested one).
     */
    @GetMapping("/session/{scheduledSessionId}")
    public ResponseEntity<TransportRequestResponseDto> getTransportBySession(
            @PathVariable UUID scheduledSessionId) {
        try {
            return ResponseEntity.ok(service.getByScheduledSessionId(scheduledSessionId));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
