package esprit.dialysisreadinesstransportservice.service.availability;

import esprit.dialysisreadinesstransportservice.dto.availability.PatientAvailabilityResponseDto;
import esprit.dialysisreadinesstransportservice.dto.availability.PatientAvailabilityResponseRequest;

import java.util.UUID;

public interface PatientAvailabilityService {
    PatientAvailabilityResponseDto getByScheduledSessionId(UUID scheduledSessionId);
    PatientAvailabilityResponseDto respond(UUID scheduledSessionId, PatientAvailabilityResponseRequest request);
}
