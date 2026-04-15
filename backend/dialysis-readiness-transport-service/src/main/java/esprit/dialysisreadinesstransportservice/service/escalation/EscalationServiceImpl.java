package esprit.dialysisreadinesstransportservice.service.escalation;

import esprit.dialysisreadinesstransportservice.client.DialysisServiceClient;
import esprit.dialysisreadinesstransportservice.dto.client.AlertRequestDTO;
import esprit.dialysisreadinesstransportservice.entity.EscalationLog;
import esprit.dialysisreadinesstransportservice.entity.PatientAvailability;
import esprit.dialysisreadinesstransportservice.entity.ReadinessCheck;
import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import esprit.dialysisreadinesstransportservice.enums.EscalationLevel;
import esprit.dialysisreadinesstransportservice.enums.ReadinessStatus;
import esprit.dialysisreadinesstransportservice.repository.EscalationLogRepository;
import esprit.dialysisreadinesstransportservice.repository.PatientAvailabilityRepository;
import esprit.dialysisreadinesstransportservice.repository.ReadinessCheckRepository;
import esprit.dialysisreadinesstransportservice.repository.TransportRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscalationServiceImpl implements EscalationService {

    private final PatientAvailabilityRepository availabilityRepository;
    private final ReadinessCheckRepository readinessRepository;
    private final EscalationLogRepository escalationLogRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final DialysisServiceClient dialysisServiceClient;

    @Override
    @Transactional
    public void checkAndTriggerEscalations() {
        log.info("Starting Escalation Monitoring check...");
        LocalDateTime now = LocalDateTime.now();

        List<PatientAvailability> upcomingSessions = availabilityRepository.findAll();

        for (PatientAvailability availability : upcomingSessions) {
            UUID sessionId = availability.getScheduledSessionId();
            LocalDateTime sessionTime = calculateExactSessionTime(availability);

            long hoursUntilSession = ChronoUnit.HOURS.between(now, sessionTime);
            if (hoursUntilSession < 0) continue; // Past session

            // Rule 1: 48h PATIENT_REMINDER_48H
            if (hoursUntilSession <= 48 && (availability.getAvailabilityStatus() == AvailabilityStatus.NO_RESPONSE || availability.getAvailabilityStatus() == null)) {
                triggerEscalationIfMissing(sessionId, availability.getPatientId(), EscalationLevel.PATIENT_REMINDER_48H, "Patient has not responded to session 48h before start.");
            }

            // For other rules we need readiness
            Optional<ReadinessCheck> readinessOpt = readinessRepository.findByScheduledSessionId(sessionId);
            if (readinessOpt.isEmpty()) continue;

            ReadinessCheck readiness = readinessOpt.get();

            // Rule 2: 24h NURSE_ALERT_24H
            if (hoursUntilSession <= 24 && readiness.getReadinessStatus() == ReadinessStatus.NOT_READY) {
                triggerEscalationIfMissing(sessionId, availability.getPatientId(), EscalationLevel.NURSE_ALERT_24H, "Session is NOT_READY 24h before start. Nurse review required.");
            }

            // Rule 3: 12h DOCTOR_ALERT_12H
            if (hoursUntilSession <= 12 && readiness.getReadinessStatus() == ReadinessStatus.NOT_READY) {
                triggerEscalationIfMissing(sessionId, availability.getPatientId(), EscalationLevel.DOCTOR_ALERT_12H, "Session is NOT_READY 12h before start. Doctor alert triggered.");
            }
        }
        log.info("Escalation Monitoring check completed.");
    }

    private void triggerEscalationIfMissing(UUID sessionId, UUID patientId, EscalationLevel level, String message) {
        if (!escalationLogRepository.existsByScheduledSessionIdAndLevel(sessionId, level)) {
            EscalationLog logEntry = EscalationLog.builder()
                    .scheduledSessionId(sessionId)
                    .patientId(patientId)
                    .level(level)
                    .triggeredAt(LocalDateTime.now())
                    .build();
            escalationLogRepository.save(logEntry);
            log.warn("Escalation Triggered! Level: {}, SessionId: {}, Message: {}", level, sessionId, message);

            // NEW: Push to Unified Alert Hub
            AlertRequestDTO alertDto = AlertRequestDTO.builder()
                    .patientId(patientId)
                    .sessionId(sessionId)
                    .severity(level == EscalationLevel.DOCTOR_ALERT_12H ? "CRITICAL" : "WARNING")
                    .category("READINESS")
                    .title("Readiness Alert: " + level.name())
                    .message(message)
                    .build();
            dialysisServiceClient.createAlert(alertDto);
        }
    }

    private LocalDateTime calculateExactSessionTime(PatientAvailability availability) {
        LocalTime time;
        switch (availability.getShift()) {
            case MORNING:
                time = LocalTime.of(8, 0);
                break;
            case AFTERNOON:
                time = LocalTime.of(13, 0);
                break;
            default:
                time = LocalTime.of(8, 0); // Safe default
                break;
        }
        return availability.getSessionDay().atTime(time);
    }
}
