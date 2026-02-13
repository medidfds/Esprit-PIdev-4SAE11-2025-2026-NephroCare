package esprit.dialysisservice.controllers;

import esprit.dialysisservice.dtos.request.DialysisSessionRequestDTO;
import esprit.dialysisservice.dtos.response.DialysisSessionResponseDTO;
import esprit.dialysisservice.services.IDialysisSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class DialysisSessionController {

    private final IDialysisSessionService sessionService;

    // 1. Start Session (Create)
    @PostMapping
    public ResponseEntity<DialysisSessionResponseDTO> createSession(
            @Valid @RequestBody DialysisSessionRequestDTO dto) {
        return ResponseEntity.ok(sessionService.createSession(dto));
    }

    // 2. End Session (Update with Calculations)
    // We use a custom endpoint for "Ending" because it triggers the Math logic
    @PutMapping("/{id}/end")
    public ResponseEntity<DialysisSessionResponseDTO> endSession(
            @PathVariable UUID id,
            @RequestParam Double weightAfter,
            @RequestParam Double postDialysisUrea) {
        return ResponseEntity.ok(sessionService.endSession(id, weightAfter, postDialysisUrea));
    }

    // 3. Update Session (Correction)
    @PutMapping("/{id}")
    public ResponseEntity<DialysisSessionResponseDTO> updateSession(
            @PathVariable UUID id,
            @Valid @RequestBody DialysisSessionRequestDTO dto) {
        return ResponseEntity.ok(sessionService.updateSession(id, dto));
    }

    // 4. Getters
    @GetMapping("/treatment/{treatmentId}")
    public ResponseEntity<List<DialysisSessionResponseDTO>> getSessionsByTreatment(@PathVariable UUID treatmentId) {
        return ResponseEntity.ok(sessionService.getSessionsByTreatment(treatmentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DialysisSessionResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }

    @GetMapping
    public ResponseEntity<List<DialysisSessionResponseDTO>> getAll() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}