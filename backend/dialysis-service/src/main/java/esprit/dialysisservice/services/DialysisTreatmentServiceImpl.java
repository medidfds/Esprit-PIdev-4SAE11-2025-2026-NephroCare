package esprit.dialysisservice.services;

import esprit.dialysisservice.dtos.request.DialysisTreatmentRequestDTO;
import esprit.dialysisservice.dtos.response.DialysisTreatmentResponseDTO;
import esprit.dialysisservice.entities.DialysisTreatment;
import esprit.dialysisservice.entities.enums.TreatmentStatus;
import esprit.dialysisservice.exceptions.EntityNotFoundException;
import esprit.dialysisservice.mapper.DialysisMapper;
import esprit.dialysisservice.repositories.DialysisTreatmentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DialysisTreatmentServiceImpl implements IDialysisTreatmentService {

    private final DialysisTreatmentRepository treatmentRepository;
    private final DialysisMapper mapper;

    /*
    ========================
        CREATE
    ========================
     */
    @Override
    public DialysisTreatmentResponseDTO addTreatment(DialysisTreatmentRequestDTO dto) {

        DialysisTreatment treatment = mapper.toEntity(dto);

        treatment.setStatus(TreatmentStatus.ACTIVE);

        if (treatment.getStartDate() == null)
            treatment.setStartDate(LocalDate.now());

        return mapper.toResponse(treatmentRepository.save(treatment));
    }

    /*
    ========================
        UPDATE
    ========================
     */
    @Override
    public DialysisTreatmentResponseDTO updateTreatment(UUID id, DialysisTreatmentRequestDTO dto) {

        DialysisTreatment existing = treatmentRepository.findById(id)
                .orElseThrow(() ->new EntityNotFoundException("Treatment not found with id: " + id));

        mapper.updateTreatmentFromDto(dto, existing);

        return mapper.toResponse(treatmentRepository.save(existing));
    }

    /*
    ========================
        GET ALL
    ========================
     */
    @Override
    public List<DialysisTreatmentResponseDTO> getAllTreatments() {

        return treatmentRepository.findAll()
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    /*
    ========================
        GET BY ID
    ========================
     */
    @Override
    public DialysisTreatmentResponseDTO getTreatmentById(UUID id) {

        DialysisTreatment treatment = treatmentRepository.findById(id)
                .orElseThrow(() ->new EntityNotFoundException("Treatment not found with id: " + id));

        return mapper.toResponse(treatment);
    }

    /*
    ========================
        GET BY PATIENT
    ========================
     */
    @Override
    public List<DialysisTreatmentResponseDTO> getTreatmentsByPatient(UUID patientId) {

        return treatmentRepository.findByPatientId(patientId)
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    /*
    ========================
        DELETE
    ========================
     */
    @Override
    public void deleteTreatment(UUID id) {

        if (!treatmentRepository.existsById(id))
            throw new RuntimeException("Treatment not found");

        treatmentRepository.deleteById(id);
    }
    @Override
    @Transactional
    public DialysisTreatmentResponseDTO suspendTreatment(UUID id, String reason) {
        DialysisTreatment treatment = treatmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Treatment not found"));

        if (treatment.getStatus() != TreatmentStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE treatments can be suspended.");
        }

        treatment.setStatus(TreatmentStatus.SUSPENDED);
        // In a real app, you would save the 'reason' in a separate table or audit log
        return mapper.toResponse(treatmentRepository.save(treatment));
    }

    @Override
    @Transactional
    public DialysisTreatmentResponseDTO archiveTreatment(UUID id) {
        DialysisTreatment treatment = treatmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Treatment not found"));

        treatment.setStatus(TreatmentStatus.ARCHIVED);
        return mapper.toResponse(treatmentRepository.save(treatment));
    }
}
