package esprit.dialysisservice.controllers;

import esprit.dialysisservice.dtos.request.DialysisTreatmentRequestDTO;
import esprit.dialysisservice.dtos.response.DialysisTreatmentResponseDTO;
import esprit.dialysisservice.services.IDialysisTreatmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/treatments")
@RequiredArgsConstructor
public class DialysisTreatmentController {

    private final IDialysisTreatmentService treatmentService;

    /*
    ========================
            CREATE
    ========================
     */
    @PostMapping
    public ResponseEntity<DialysisTreatmentResponseDTO> createTreatment(
            @Valid @RequestBody DialysisTreatmentRequestDTO requestDTO
    ) {

        DialysisTreatmentResponseDTO createdTreatment =
                treatmentService.addTreatment(requestDTO);

        return ResponseEntity
                .created(URI.create("/api/treatments/" + createdTreatment.getId()))
                .body(createdTreatment);
    }

    /*
    ========================
            GET ALL
    ========================
     */
    @GetMapping
    public ResponseEntity<List<DialysisTreatmentResponseDTO>> getAllTreatments() {

        return ResponseEntity.ok(
                treatmentService.getAllTreatments()
        );
    }

    /*
    ========================
        GET BY ID
    ========================
     */
    @GetMapping("/{id}")
    public ResponseEntity<DialysisTreatmentResponseDTO> getTreatmentById(
            @PathVariable UUID id
    ) {

        return ResponseEntity.ok(
                treatmentService.getTreatmentById(id)
        );
    }

    /*
    ========================
        GET BY PATIENT
    ========================
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<DialysisTreatmentResponseDTO>> getTreatmentsByPatient(
            @PathVariable UUID patientId
    ) {

        return ResponseEntity.ok(
                treatmentService.getTreatmentsByPatient(patientId)
        );
    }

    /*
    ========================
            UPDATE
    ========================
     */
    @PutMapping("/{id}")
    public ResponseEntity<DialysisTreatmentResponseDTO> updateTreatment(
            @PathVariable UUID id,
            @Valid @RequestBody DialysisTreatmentRequestDTO requestDTO
    ) {

        return ResponseEntity.ok(
                treatmentService.updateTreatment(id, requestDTO)
        );
    }

    /*
    ========================
            DELETE
    ========================
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTreatment(@PathVariable UUID id) {

        treatmentService.deleteTreatment(id);
        return ResponseEntity.noContent().build();
    }
}
