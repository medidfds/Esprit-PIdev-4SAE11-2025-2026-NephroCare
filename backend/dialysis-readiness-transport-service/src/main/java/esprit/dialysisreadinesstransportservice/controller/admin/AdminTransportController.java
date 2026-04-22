package esprit.dialysisreadinesstransportservice.controller.admin;

import esprit.dialysisreadinesstransportservice.dto.transport.ApproveTransportRequestDto;
import esprit.dialysisreadinesstransportservice.dto.transport.RejectTransportRequestDto;
import esprit.dialysisreadinesstransportservice.dto.transport.TransportRequestResponseDto;
import esprit.dialysisreadinesstransportservice.service.transport.TransportRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/transport")
@RequiredArgsConstructor
public class AdminTransportController {

    private final TransportRequestService service;

    @GetMapping("/pending")
    public ResponseEntity<List<TransportRequestResponseDto>> getPendingRequests() {
        return ResponseEntity.ok(service.getPendingRequests());
    }

    @GetMapping("/session/{scheduledSessionId}")
    public ResponseEntity<TransportRequestResponseDto> getByScheduledSessionId(@PathVariable UUID scheduledSessionId) {
        return ResponseEntity.ok(service.getByScheduledSessionId(scheduledSessionId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<TransportRequestResponseDto> approveRequest(
            @PathVariable UUID id,
            @RequestBody ApproveTransportRequestDto request) {
        return ResponseEntity.ok(service.approve(id, request));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<TransportRequestResponseDto> rejectRequest(
            @PathVariable UUID id,
            @RequestBody RejectTransportRequestDto request) {
        return ResponseEntity.ok(service.reject(id, request));
    }
}
