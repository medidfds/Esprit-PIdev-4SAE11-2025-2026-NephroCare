package esprit.dialysisreadinesstransportservice.service.readiness;

import esprit.dialysisreadinesstransportservice.dto.readiness.ReadinessResponseDto;
import esprit.dialysisreadinesstransportservice.entity.PatientAvailability;
import esprit.dialysisreadinesstransportservice.entity.ReadinessCheck;
import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.enums.AvailabilityStatus;
import esprit.dialysisreadinesstransportservice.enums.ChildMood;
import esprit.dialysisreadinesstransportservice.enums.ReadinessStatus;
import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import esprit.dialysisreadinesstransportservice.exception.ResourceNotFoundException;
import esprit.dialysisreadinesstransportservice.mapper.ReadinessMapper;
import esprit.dialysisreadinesstransportservice.repository.PatientAvailabilityRepository;
import esprit.dialysisreadinesstransportservice.repository.ReadinessCheckRepository;
import esprit.dialysisreadinesstransportservice.repository.TransportRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadinessServiceImpl implements ReadinessService {

    private final PatientAvailabilityRepository availabilityRepository;
    private final TransportRequestRepository transportRepository;
    private final ReadinessCheckRepository readinessRepository;
    private final ReadinessMapper readinessMapper;

    @Override
    public List<ReadinessResponseDto> getAllReadinessChecks() {
        return readinessRepository.findAll().stream()
                .map(readinessMapper::toDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public ReadinessResponseDto getByScheduledSessionId(UUID scheduledSessionId) {
        ReadinessCheck check = readinessRepository.findByScheduledSessionId(scheduledSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Readiness check not found for session id: " + scheduledSessionId));
        return readinessMapper.toDto(check);
    }

    @Override
    @Transactional
    public ReadinessResponseDto recompute(UUID scheduledSessionId) {
        log.info("Recomputing readiness for session {}", scheduledSessionId);
        
        ReadinessCheck readiness = readinessRepository.findByScheduledSessionId(scheduledSessionId)
                .orElse(ReadinessCheck.builder()
                        .scheduledSessionId(scheduledSessionId)
                        .evaluatedAt(LocalDateTime.now())
                        .build());
                        
        PatientAvailability availability = availabilityRepository.findByScheduledSessionId(scheduledSessionId)
                .orElse(null);
                
        TransportRequest transport = transportRepository.findByScheduledSessionId(scheduledSessionId)
                .orElse(null);
        
        UUID patientId = availability != null ? availability.getPatientId() : (transport != null ? transport.getPatientId() : null);
        if (patientId == null) {
            log.warn("Cannot recompute readiness without explicit patient context.");
            return readinessMapper.toDto(readiness);
        }
        
        readiness.setPatientId(patientId);
        readiness.setAvailabilityId(availability != null ? availability.getId() : null);
        readiness.setTransportRequestId(transport != null ? transport.getId() : null);

        // Clean previous states
        readiness.setLogisticalScore(null);
        readiness.setPsychosocialScore(null);
        readiness.setGlobalScore(null);
        readiness.setBlockingReason(null);
        readiness.setWarningReason(null);
        
        if (availability == null) {
            readiness.setReadinessStatus(ReadinessStatus.NOT_READY);
            readiness.setBlockingReason("No availability data provided");
        } else {
            boolean hasConfirmedTransport = transport != null && transport.getStatus() == TransportRequestStatus.CONFIRMED;

            // HARD BLOCKERS
            if (availability.getAvailabilityStatus() == AvailabilityStatus.UNAVAILABLE) {
                readiness.setReadinessStatus(ReadinessStatus.NOT_READY);
                readiness.setBlockingReason("Patient unavailable");
            } else if (availability.getChildMood() == ChildMood.REFUSING) {
                readiness.setReadinessStatus(ReadinessStatus.NOT_READY);
                readiness.setBlockingReason("Child refusing dialysis session");
            } else if (availability.isTransportNeeded() && !availability.isHasTransportAlternative() && !hasConfirmedTransport) {
                readiness.setReadinessStatus(ReadinessStatus.NOT_READY);
                readiness.setBlockingReason("No confirmed transport solution");
            } else if (availability.getAvailabilityStatus() == AvailabilityStatus.NO_RESPONSE || availability.getAvailabilityStatus() == null) {
                readiness.setReadinessStatus(ReadinessStatus.NOT_READY);
                readiness.setBlockingReason("Awaiting patient response");
            } else {
                // COMPUTE SCORES
                double logScore = 0.0;
                if (availability.getAvailabilityStatus() == AvailabilityStatus.CONFIRMED) {
                    logScore += 40;
                }
                
                if (!availability.isTransportNeeded()) {
                    logScore += 40;
                } else if (hasConfirmedTransport) {
                    logScore += 40;
                } else if (availability.isHasTransportAlternative()) {
                    logScore += 25;
                }

                if (availability.getResponseTime() != null) {
                    logScore += 20;
                }

                double psychoScore = 50.0;
                if (availability.getChildMood() != null) {
                    if (availability.getChildMood() == ChildMood.CALM) {
                        psychoScore = 100.0;
                    } else if (availability.getChildMood() == ChildMood.ANXIOUS) {
                        psychoScore = 60.0;
                    }
                }

                double globalScore = (logScore * 0.6) + (psychoScore * 0.4);
                
                readiness.setLogisticalScore(logScore);
                readiness.setPsychosocialScore(psychoScore);
                readiness.setGlobalScore(globalScore);

                if (globalScore >= 80) {
                    readiness.setReadinessStatus(ReadinessStatus.READY);
                } else if (globalScore >= 50 && globalScore < 80) {
                    readiness.setReadinessStatus(ReadinessStatus.READY_WITH_WARNING);
                } else {
                    readiness.setReadinessStatus(ReadinessStatus.NOT_READY);
                }

                // Warnings
                if (availability.getChildMood() == ChildMood.ANXIOUS) {
                    readiness.setWarningReason("Child anxious");
                } else if (availability.isTransportNeeded() && availability.isHasTransportAlternative() && !hasConfirmedTransport) {
                    readiness.setWarningReason("Transport covered by alternative only");
                }
            }
        }
        
        readiness.setEvaluatedAt(LocalDateTime.now());
        readiness = readinessRepository.saveAndFlush(readiness);
        
        log.info("Readiness recomputed. Final status: {}, Blocking Reason: {}, Warning Reason: {}", 
                readiness.getReadinessStatus(),
                readiness.getBlockingReason() != null ? readiness.getBlockingReason() : "None",
                readiness.getWarningReason() != null ? readiness.getWarningReason() : "None");
                
        return readinessMapper.toDto(readiness);
    }
}
