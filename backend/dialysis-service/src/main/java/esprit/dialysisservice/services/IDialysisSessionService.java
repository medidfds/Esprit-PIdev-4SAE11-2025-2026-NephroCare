package esprit.dialysisservice.services;

import esprit.dialysisservice.dtos.request.DialysisSessionRequestDTO;
import esprit.dialysisservice.dtos.response.DialysisSessionResponseDTO;
import esprit.dialysisservice.entities.DialysisSession;
import esprit.dialysisservice.entities.DialysisTreatment;

import java.util.List;
import java.util.UUID;

public interface IDialysisSessionService {
    // Now takes a DTO, returns a DTO
    DialysisSessionResponseDTO createSession(DialysisSessionRequestDTO dto);

    // specific method for ending a session (calculations happen here)
    DialysisSessionResponseDTO endSession(UUID sessionId, Double weightAfter, Double postDialysisUrea, Double preDialysisUrea);
    DialysisSessionResponseDTO updateSession(UUID id, DialysisSessionRequestDTO dto);

    DialysisSessionResponseDTO getSessionById(UUID id);

    List<DialysisSessionResponseDTO> getSessionsByTreatment(UUID treatmentId);

    List<DialysisSessionResponseDTO> getAllSessions();

    void deleteSession(UUID id);
    // Analytics: Get all sessions for a patient (cross-treatment)
    List<DialysisSessionResponseDTO> getPatientHistory(UUID patientId);

    // Analytics: Calculate Average Kt/V for a specific treatment
    Double calculateAverageKtV(UUID treatmentId);
}