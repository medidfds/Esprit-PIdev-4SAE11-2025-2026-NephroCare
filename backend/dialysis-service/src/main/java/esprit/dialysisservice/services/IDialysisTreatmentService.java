package esprit.dialysisservice.services;

import esprit.dialysisservice.dtos.request.DialysisTreatmentRequestDTO;
import esprit.dialysisservice.dtos.response.DialysisTreatmentResponseDTO;
import esprit.dialysisservice.entities.DialysisTreatment;

import java.util.List;
import java.util.UUID;

public interface IDialysisTreatmentService {

    DialysisTreatmentResponseDTO addTreatment(DialysisTreatmentRequestDTO dto);

    DialysisTreatmentResponseDTO updateTreatment(UUID id, DialysisTreatmentRequestDTO dto);

    List<DialysisTreatmentResponseDTO> getAllTreatments();

    DialysisTreatmentResponseDTO getTreatmentById(UUID id);

    List<DialysisTreatmentResponseDTO> getTreatmentsByPatient(UUID patientId);

    void deleteTreatment(UUID id);
}
