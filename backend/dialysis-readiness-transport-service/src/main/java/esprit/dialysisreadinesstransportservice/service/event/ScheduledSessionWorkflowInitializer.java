package esprit.dialysisreadinesstransportservice.service.event;

import esprit.dialysisreadinesstransportservice.dto.event.ScheduledSessionConfirmedEvent;
import esprit.dialysisreadinesstransportservice.entity.PatientAvailability;
import esprit.dialysisreadinesstransportservice.entity.PatientTransportPreference;
import esprit.dialysisreadinesstransportservice.entity.ReadinessCheck;
import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import esprit.dialysisreadinesstransportservice.enums.ReadinessStatus;
import esprit.dialysisreadinesstransportservice.enums.RequestSource;
import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import esprit.dialysisreadinesstransportservice.repository.PatientAvailabilityRepository;
import esprit.dialysisreadinesstransportservice.repository.PatientTransportPreferenceRepository;
import esprit.dialysisreadinesstransportservice.repository.ReadinessCheckRepository;
import esprit.dialysisreadinesstransportservice.repository.TransportRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledSessionWorkflowInitializer {

    private final PatientAvailabilityRepository patientAvailabilityRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final PatientTransportPreferenceRepository patientTransportPreferenceRepository;
    private final ReadinessCheckRepository readinessCheckRepository;

    @Transactional
    public void initializeWorkflow(ScheduledSessionConfirmedEvent event) {
        if (patientAvailabilityRepository.findByScheduledSessionId(event.getScheduledSessionId()).isPresent()) {
            log.info("Workflow already initialized for session id {}. Skipping.", event.getScheduledSessionId());
            return;
        }

        log.info("Initializing readiness workflow for scheduled session {}", event.getScheduledSessionId());

        // Step 1: Create PatientAvailability
        PatientAvailability availability = PatientAvailability.builder()
                .scheduledSessionId(event.getScheduledSessionId())
                .patientId(event.getPatientId())
                .sessionDay(event.getDay())
                .shift(event.getShift())
                .availabilityStatus(AvailabilityStatus.NO_RESPONSE)
                .createdAt(LocalDateTime.now())
                .build();
        patientAvailabilityRepository.save(availability);
        log.info("Created PatientAvailability for session {}", event.getScheduledSessionId());

        // Step 2: Check transport preference
        Optional<PatientTransportPreference> prefOpt = patientTransportPreferenceRepository.findByPatientId(event.getPatientId());
        if (prefOpt.isPresent() && prefOpt.get().isDefaultTransportNeeded()) {
            PatientTransportPreference pref = prefOpt.get();
            TransportRequest request = TransportRequest.builder()
                    .scheduledSessionId(event.getScheduledSessionId())
                    .patientId(event.getPatientId())
                    .sessionDay(event.getDay())
                    .shift(event.getShift())
                    .pickupZone(pref.getPreferredPickupZone())
                    .pickupAddress(pref.getPickupAddress())
                    .pickupLat(pref.getPickupLat())
                    .pickupLng(pref.getPickupLng())
                    .wheelchairRequired(pref.isWheelchairRequired())
                    .status(TransportRequestStatus.PENDING_APPROVAL)
                    .requestedBy(RequestSource.SYSTEM)
                    .createdAt(LocalDateTime.now())
                    .build();
            transportRequestRepository.save(request);
            log.info("Created TransportRequest for session {} based on preferences", event.getScheduledSessionId());
        }

        // Step 3: Create initial ReadinessCheck
        ReadinessCheck readiness = ReadinessCheck.builder()
                .scheduledSessionId(event.getScheduledSessionId())
                .patientId(event.getPatientId())
                .readinessStatus(ReadinessStatus.NOT_READY)
                .blockingReason("Awaiting patient response")
                .evaluatedAt(LocalDateTime.now())
                .build();
        readinessCheckRepository.save(readiness);
        log.info("Initialized ReadinessCheck for session {} as NOT_READY", event.getScheduledSessionId());
    }
}
