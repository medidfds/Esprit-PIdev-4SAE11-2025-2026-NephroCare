package esprit.dialysisreadinesstransportservice.service.availability;

import esprit.dialysisreadinesstransportservice.client.DialysisServiceClient;
import esprit.dialysisreadinesstransportservice.dto.availability.PatientAvailabilityResponseDto;
import esprit.dialysisreadinesstransportservice.dto.availability.PatientAvailabilityResponseRequest;
import esprit.dialysisreadinesstransportservice.dto.client.ScheduledSessionDto;
import esprit.dialysisreadinesstransportservice.entity.PatientAvailability;
import esprit.dialysisreadinesstransportservice.entity.PatientTransportPreference;
import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import esprit.dialysisreadinesstransportservice.enums.RequestSource;
import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import esprit.dialysisreadinesstransportservice.exception.ResourceNotFoundException;
import esprit.dialysisreadinesstransportservice.mapper.PatientAvailabilityMapper;
import esprit.dialysisreadinesstransportservice.repository.PatientAvailabilityRepository;
import esprit.dialysisreadinesstransportservice.repository.PatientTransportPreferenceRepository;
import esprit.dialysisreadinesstransportservice.repository.TransportRequestRepository;
import esprit.dialysisreadinesstransportservice.service.readiness.ReadinessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientAvailabilityServiceImpl implements PatientAvailabilityService {

    private final PatientAvailabilityRepository repository;
    private final PatientAvailabilityMapper mapper;
    private final ReadinessService readinessService;
    private final DialysisServiceClient dialysisServiceClient;
    private final TransportRequestRepository transportRequestRepository;
    private final PatientTransportPreferenceRepository patientTransportPreferenceRepository;

    @Override
    public PatientAvailabilityResponseDto getByScheduledSessionId(UUID scheduledSessionId) {
        PatientAvailability availability = repository.findByScheduledSessionId(scheduledSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability not found for session id: " + scheduledSessionId));
        return mapper.toDto(availability);
    }

    @Override
    @Transactional
    public PatientAvailabilityResponseDto respond(UUID scheduledSessionId, PatientAvailabilityResponseRequest request) {
        log.info("Saving patient response for session id: {}", scheduledSessionId);

        PatientAvailability availability = repository.findByScheduledSessionId(scheduledSessionId)
                .orElseGet(() -> createFallbackAvailability(scheduledSessionId));

        availability.setAvailabilityStatus(request.getAvailabilityStatus());
        availability.setChildMood(request.getChildMood());
        availability.setTransportNeeded(request.isTransportNeeded());
        availability.setHasTransportAlternative(request.isHasTransportAlternative());
        availability.setComment(request.getComment());
        availability.setResponseTime(LocalDateTime.now());
        availability.setUpdatedAt(LocalDateTime.now());

        availability = repository.saveAndFlush(availability);
        log.info("Patient response saved and flushed. Status: {}", availability.getAvailabilityStatus());

        // Business Rule: If transport needed but no request exists, create one
        if (availability.isTransportNeeded()) {
            ensureTransportRequestExists(availability);
        }

        log.info("Triggering readiness recompute for session id: {}", scheduledSessionId);
        readinessService.recompute(scheduledSessionId);

        return mapper.toDto(availability);
    }

    /**
     * Ensures a TransportRequest exists for the given availability.
     * Uses patient preferences if available.
     */
    private void ensureTransportRequestExists(PatientAvailability availability) {
        if (transportRequestRepository.findByScheduledSessionId(availability.getScheduledSessionId()).isPresent()) {
            log.debug("TransportRequest already exists for session {}", availability.getScheduledSessionId());
            return;
        }

        log.info("Creating new TransportRequest for session {} based on patient response", availability.getScheduledSessionId());

        PatientTransportPreference pref = patientTransportPreferenceRepository.findByPatientId(availability.getPatientId())
                .orElse(null);

        TransportRequest transportRequest = TransportRequest.builder()
                .scheduledSessionId(availability.getScheduledSessionId())
                .patientId(availability.getPatientId())
                .sessionDay(availability.getSessionDay())
                .shift(availability.getShift())
                .pickupZone(pref != null ? pref.getPreferredPickupZone() : null)
                .pickupAddress(pref != null ? pref.getPickupAddress() : null)
                .pickupLat(pref != null ? pref.getPickupLat() : null)
                .pickupLng(pref != null ? pref.getPickupLng() : null)
                .wheelchairRequired(pref != null && pref.isWheelchairRequired())
                .status(TransportRequestStatus.PENDING_APPROVAL)
                .requestedBy(RequestSource.PATIENT)
                .createdAt(LocalDateTime.now())
                .build();

        transportRequestRepository.save(transportRequest);
        log.info("TransportRequest created successfully for session {}", availability.getScheduledSessionId());
    }

    /**
     * Fallback: if PatientAvailability is missing (e.g. RabbitMQ event was not published/consumed),
     * fetch session details from dialysis-service and create a default availability row on the fly.
     * This makes the respond() endpoint resilient for pre-existing or missed sessions.
     */
    private PatientAvailability createFallbackAvailability(UUID scheduledSessionId) {
        log.warn("PatientAvailability missing for session {}. Attempting fallback creation via dialysis-service.", scheduledSessionId);

        ScheduledSessionDto session = dialysisServiceClient.getScheduledSession(scheduledSessionId)
                .orElseThrow(() -> {
                    log.error("Cannot create fallback: dialysis-service returned no session for id {}", scheduledSessionId);
                    return new ResourceNotFoundException("Availability not found for session id: " + scheduledSessionId
                            + " and could not retrieve session details from dialysis-service.");
                });

        if (session.getPatientId() == null || session.getDay() == null || session.getShift() == null) {
            log.error("Cannot create fallback: session {} is missing required fields (patientId={}, day={}, shift={})",
                    scheduledSessionId, session.getPatientId(), session.getDay(), session.getShift());
            throw new ResourceNotFoundException("Availability not found for session id: " + scheduledSessionId
                    + " and session data is incomplete.");
        }

        // Rule: Do not allow availability logic if nurse has not accepted
        if (!"ACCEPTED".equalsIgnoreCase(session.getNurseConfirmation())) {
            log.warn("Patient attempting to respond to session {} which is not yet ACCEPTED by nurse (status={})",
                    scheduledSessionId, session.getNurseConfirmation());
            throw new ResourceNotFoundException("This session is pending nurse confirmation. Please wait before responding.");
        }

        PatientAvailability fallback = PatientAvailability.builder()
                .scheduledSessionId(scheduledSessionId)
                .patientId(session.getPatientId())
                .sessionDay(session.getDay())
                .shift(session.getShift())
                .availabilityStatus(AvailabilityStatus.NO_RESPONSE)
                .createdAt(LocalDateTime.now())
                .build();

        PatientAvailability saved = repository.save(fallback);
        log.info("Fallback PatientAvailability created for session {} (patientId={})", scheduledSessionId, session.getPatientId());
        return saved;
    }
}

