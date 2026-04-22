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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
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

    /**
     * FIX (self-proxy injection):
     * Calling a @Transactional method from within the same class bypasses Spring AOP proxy,
     * so REQUIRES_NEW would have no effect. We inject 'self' lazily to route the call
     * through the proxy, guaranteeing the new transaction is actually started.
     */
    @Autowired
    @Lazy
    private EscalationServiceImpl self;

    @Override
    @Transactional
    @Scheduled(fixedRate = 10000) // every 10 seconds for demo
    public void checkAndTriggerEscalations() {
        log.info("Escalation check running...");
        LocalDateTime now = LocalDateTime.now();

        List<PatientAvailability> upcomingSessions = availabilityRepository.findAll();
        log.info("Total PatientAvailability records found: {}", upcomingSessions.size());

        for (PatientAvailability availability : upcomingSessions) {
            UUID sessionId = availability.getScheduledSessionId();
            LocalDateTime sessionTime = calculateExactSessionTime(availability);

            long hoursUntilSession = ChronoUnit.HOURS.between(now, sessionTime);
            log.info("Session {} → hoursUntilSession={}", sessionId, hoursUntilSession);

            if (hoursUntilSession < 0) {
                log.info("Session {} is in the past ({}h). Skipping.", sessionId, hoursUntilSession);
                continue; // Past session
            }

            log.info("AvailabilityStatus: {}", availability.getAvailabilityStatus());

            // Rule 1: 48h PATIENT_REMINDER_48H
            if (hoursUntilSession <= 48 && (availability.getAvailabilityStatus() == AvailabilityStatus.NO_RESPONSE || availability.getAvailabilityStatus() == null)) {
                log.info("Rule 48h triggered for session {}. Checking for existing escalation...", sessionId);
                triggerEscalationIfMissing(sessionId, availability.getPatientId(), EscalationLevel.PATIENT_REMINDER_48H, "Patient has not responded to session 48h before start.");
            }

            // For other rules we need readiness
            Optional<ReadinessCheck> readinessOpt = readinessRepository.findByScheduledSessionId(sessionId);
            if (readinessOpt.isEmpty()) {
                log.info("No ReadinessCheck found for session {}. Skipping 24h/12h rules.", sessionId);
                continue;
            }

            ReadinessCheck readiness = readinessOpt.get();
            log.info("ReadinessStatus: {}", readiness.getReadinessStatus());

            // Rule 2: 24h NURSE_ALERT_24H
            if (hoursUntilSession <= 24 && readiness.getReadinessStatus() == ReadinessStatus.NOT_READY) {
                log.info("Rule 24h triggered for session {}. Checking for existing escalation...", sessionId);
                triggerEscalationIfMissing(sessionId, availability.getPatientId(), EscalationLevel.NURSE_ALERT_24H, "Session is NOT_READY 24h before start. Nurse review required.");
            }

            // Rule 3: 12h DOCTOR_ALERT_12H
            if (hoursUntilSession <= 12 && readiness.getReadinessStatus() == ReadinessStatus.NOT_READY) {
                log.info("Rule 12h triggered for session {}. Checking for existing escalation...", sessionId);
                triggerEscalationIfMissing(sessionId, availability.getPatientId(), EscalationLevel.DOCTOR_ALERT_12H, "Session is NOT_READY 12h before start. Doctor alert triggered.");
            }
        }
        log.info("Escalation Monitoring check completed.");
    }

    /**
     * Saves the EscalationLog in a NEW, independent transaction so it commits
     * immediately — before the alert HTTP call is attempted. This means that even
     * if the remote alert push fails, the DB record is already durably written.
     *
     * Called via 'self' (the Spring proxy of this bean) so that @Transactional
     * REQUIRES_NEW is actually honoured by the AOP interceptor.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveEscalationLog(UUID sessionId, UUID patientId, EscalationLevel level) {
        EscalationLog logEntry = EscalationLog.builder()
                .scheduledSessionId(sessionId)
                .patientId(patientId)
                .level(level)
                .triggeredAt(LocalDateTime.now())
                .build();
        escalationLogRepository.save(logEntry);
        log.info("Escalation saved for session {} at level {}", sessionId, level);
    }

    private void triggerEscalationIfMissing(UUID sessionId, UUID patientId, EscalationLevel level, String message) {
        boolean alreadyExists = escalationLogRepository.existsByScheduledSessionIdAndLevel(sessionId, level);
        log.info("existsByScheduledSessionIdAndLevel({}, {}) = {}", sessionId, level, alreadyExists);

        if (!alreadyExists) {
            // FIX: Invoke through 'self' proxy so REQUIRES_NEW is honoured.
            // The log is committed before the alert push — alert failure cannot roll it back.
            self.saveEscalationLog(sessionId, patientId, level);
            log.warn("Escalation Triggered! Level: {}, SessionId: {}, Message: {}", level, sessionId, message);

            // Push alert AFTER the save has been committed — failure here is non-fatal.
            try {
                AlertRequestDTO alertDto = AlertRequestDTO.builder()
                        .patientId(patientId)
                        .sessionId(sessionId)
                        .severity(level == EscalationLevel.DOCTOR_ALERT_12H ? "CRITICAL" : "WARNING")
                        .category("READINESS")
                        .title("Readiness Alert: " + level.name())
                        .message(message)
                        .build();
                dialysisServiceClient.createAlert(alertDto);
                log.info("Alert pushed to dialysis-service for session {} level {}", sessionId, level);
            } catch (Exception e) {
                log.error("Alert push failed for session {} level {} — escalation log is already committed: {}", sessionId, level, e.getMessage());
            }
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
