package esprit.dialysisreadinesstransportservice.controller.patient;

import esprit.dialysisreadinesstransportservice.dto.preference.PatientTransportPreferenceDto;
import esprit.dialysisreadinesstransportservice.dto.preference.SaveTransportPreferenceRequestDto;
import esprit.dialysisreadinesstransportservice.service.preference.PatientTransportPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/patient/preferences/transport")
@RequiredArgsConstructor
public class PatientTransportPreferenceController {

    private final PatientTransportPreferenceService service;

    @GetMapping("/{patientId}")
    public ResponseEntity<PatientTransportPreferenceDto> getPreference(@PathVariable UUID patientId) {
        return ResponseEntity.ok(service.getByPatientId(patientId));
    }

    @PutMapping("/{patientId}")
    public ResponseEntity<PatientTransportPreferenceDto> updatePreference(
            @PathVariable UUID patientId,
            @RequestBody SaveTransportPreferenceRequestDto request) {
        return ResponseEntity.ok(service.saveOrUpdate(patientId, request));
    }
}
