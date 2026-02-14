package esprit.dialysisservice.services;

import esprit.dialysisservice.dtos.request.DialysisSessionRequestDTO;
import esprit.dialysisservice.dtos.response.DialysisSessionResponseDTO;
import esprit.dialysisservice.entities.DialysisSession;
import esprit.dialysisservice.entities.DialysisTreatment;
import esprit.dialysisservice.entities.enums.TreatmentStatus;
import esprit.dialysisservice.exceptions.EntityNotFoundException;
import esprit.dialysisservice.mapper.DialysisMapper;
import esprit.dialysisservice.repositories.DialysisSessionRepository;
import esprit.dialysisservice.repositories.DialysisTreatmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j // For logging
public class DialysisSessionServiceImpl implements IDialysisSessionService {

    private final DialysisSessionRepository sessionRepository;
    private final DialysisTreatmentRepository treatmentRepository;
    private final DialysisMapper mapper;

    @Override
    @Transactional
    public DialysisSessionResponseDTO createSession(DialysisSessionRequestDTO dto) {
        // 1. Verify Treatment Exists
        DialysisTreatment treatment = treatmentRepository.findById(dto.getTreatmentId())
                .orElseThrow(() -> new EntityNotFoundException("Treatment not found with ID: " + dto.getTreatmentId()));

        // 2. Business Rule: Can only start session if Treatment is ACTIVE
        if (treatment.getStatus() != TreatmentStatus.ACTIVE) {
            throw new IllegalStateException("Cannot start session. Treatment status is: " + treatment.getStatus());
        }

        // 3. Map DTO to Entity
        DialysisSession session = mapper.toEntity(dto);
        session.setTreatment(treatment);
        session.setSessionDate(LocalDateTime.now());

        // 4. Save and Return
        DialysisSession savedSession = sessionRepository.save(session);
        log.info("Session created successfully for Treatment ID: {}", treatment.getId());

        return mapper.toSessionResponse(savedSession);
    }

    @Override
    @Transactional
    public DialysisSessionResponseDTO endSession(UUID sessionId, Double weightAfter, Double postDialysisUrea, Double preDialysisUrea) {
        DialysisSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found"));

        session.setWeightAfter(weightAfter);
        session.setPostDialysisUrea(postDialysisUrea);

        // Set Pre-Urea if provided (essential for Kt/V)
        if (preDialysisUrea != null) {
            session.setPreDialysisUrea(preDialysisUrea);
        }

        calculateSessionMetrics(session);

        return mapper.toSessionResponse(sessionRepository.save(session));
    }

    // Helper method for Math Logic
    private void calculateSessionMetrics(DialysisSession session) {
        Double weightBefore = session.getWeightBefore();
        Double weightAfter = session.getWeightAfter();
        Double preUrea = session.getPreDialysisUrea();
        Double postUrea = session.getPostDialysisUrea();

        // A. Ultrafiltration Volume Calculation (Weight Loss)
        if (weightBefore != null && weightAfter != null) {
            double uf = weightBefore - weightAfter;
            session.setUltrafiltrationVolume(uf);
            log.debug("Calculated UF Volume: {} kg", uf);
        }

        // B. Kt/V Calculation (Daugirdas Second Generation Formula)
        // Kt/V = -ln(R - 0.008*t) + (4 - 3.5*R) * UF/W
        // R = PostUrea / PreUrea
        // t = duration in hours (We need to get this from Treatment)
        if (preUrea != null && postUrea != null && preUrea > 0 && weightAfter != null) {

            // Get duration from parent treatment (convert minutes to hours)
            Double durationMinutes = (double) session.getTreatment().getPrescribedDurationMinutes();
            if (durationMinutes == null) durationMinutes = 240.0; // Default fallback

            double t = durationMinutes / 60.0;
            double r = postUrea / preUrea;
            double uf = session.getUltrafiltrationVolume() != null ? session.getUltrafiltrationVolume() : 0.0;
            double w = weightAfter;

            // Daugirdas Formula
            double ktV = -Math.log(r - 0.008 * t) + (4.0 - 3.5 * r) * (uf / w);

            // Round to 2 decimal places
            session.setAchievedKtV(Math.round(ktV * 100.0) / 100.0);
            log.info("Calculated Kt/V: {}", session.getAchievedKtV());
        }
    }

    @Override
    @Transactional
    public DialysisSessionResponseDTO updateSession(UUID id, DialysisSessionRequestDTO dto) {
        DialysisSession existing = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Update allowed fields
        existing.setWeightBefore(dto.getWeightBefore());
        existing.setWeightAfter(dto.getWeightAfter());
        existing.setPreBloodPressure(dto.getPreBloodPressure());
        existing.setComplications(dto.getComplications());

        // Re-calculate metrics if data changed
        if (dto.getWeightBefore() != null && dto.getWeightAfter() != null) {
            existing.setUltrafiltrationVolume(dto.getWeightBefore() - dto.getWeightAfter());
        }

        return mapper.toSessionResponse(sessionRepository.save(existing));
    }

    @Override
    public List<DialysisSessionResponseDTO> getSessionsByTreatment(UUID treatmentId) {
        return sessionRepository.findByTreatmentId(treatmentId)
                .stream()
                .map(mapper::toSessionResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DialysisSessionResponseDTO getSessionById(UUID id) {
        return sessionRepository.findById(id)
                .map(mapper::toSessionResponse)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    @Override
    public List<DialysisSessionResponseDTO> getAllSessions() {
        return sessionRepository.findAll()
                .stream()
                .map(mapper::toSessionResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteSession(UUID id) {
        if (!sessionRepository.existsById(id)) throw new RuntimeException("Session not found");
        sessionRepository.deleteById(id);
    }
    @Override
    public List<DialysisSessionResponseDTO> getPatientHistory(UUID patientId) {
        // This finds all sessions by looking up the PatientID in the parent Treatment table
        // You need to add this method to your SessionRepository (see step 3 below)
        return sessionRepository.findByTreatmentPatientId(patientId)
                .stream()
                .map(mapper::toSessionResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Double calculateAverageKtV(UUID treatmentId) {
        // Get all sessions for this treatment
        List<DialysisSession> sessions = sessionRepository.findByTreatmentId(treatmentId);

        // Filter only sessions where Kt/V was actually calculated (not null)
        double avg = sessions.stream()
                .filter(s -> s.getAchievedKtV() != null)
                .mapToDouble(DialysisSession::getAchievedKtV)
                .average()
                .orElse(0.0); // Return 0.0 if no data

        return Math.round(avg * 100.0) / 100.0; // Round to 2 decimals
    }
    // NEW: Add a method to check if treatment is adequate
    public String getDialysisAdequacyStatus(UUID treatmentId) {
        Double avgKtV = calculateAverageKtV(treatmentId);

        if (avgKtV >= 1.2) {
            return "ADEQUATE (Avg Kt/V: " + avgKtV + ")";
        } else {
            return "INSUFFICIENT (Avg Kt/V: " + avgKtV + ") - Review Prescription";
        }
    }
}