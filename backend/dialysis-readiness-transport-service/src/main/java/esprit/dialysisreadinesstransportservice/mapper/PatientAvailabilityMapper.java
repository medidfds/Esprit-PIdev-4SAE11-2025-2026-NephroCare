package esprit.dialysisreadinesstransportservice.mapper;

import esprit.dialysisreadinesstransportservice.dto.availability.PatientAvailabilityResponseDto;
import esprit.dialysisreadinesstransportservice.entity.PatientAvailability;
import org.springframework.stereotype.Component;

@Component
public class PatientAvailabilityMapper {
    public PatientAvailabilityResponseDto toDto(PatientAvailability entity) {
        if (entity == null) return null;
        return PatientAvailabilityResponseDto.builder()
                .scheduledSessionId(entity.getScheduledSessionId())
                .patientId(entity.getPatientId())
                .availabilityStatus(entity.getAvailabilityStatus())
                .childMood(entity.getChildMood())
                .transportNeeded(entity.isTransportNeeded())
                .hasTransportAlternative(entity.isHasTransportAlternative())
                .responseTime(entity.getResponseTime())
                .build();
    }
}
