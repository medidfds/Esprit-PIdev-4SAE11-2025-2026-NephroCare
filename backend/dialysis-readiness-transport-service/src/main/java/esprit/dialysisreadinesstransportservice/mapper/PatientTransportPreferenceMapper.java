package esprit.dialysisreadinesstransportservice.mapper;

import esprit.dialysisreadinesstransportservice.dto.preference.PatientTransportPreferenceDto;
import esprit.dialysisreadinesstransportservice.entity.PatientTransportPreference;
import org.springframework.stereotype.Component;

@Component
public class PatientTransportPreferenceMapper {
    public PatientTransportPreferenceDto toDto(PatientTransportPreference entity) {
        if (entity == null) return null;
        return PatientTransportPreferenceDto.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .defaultTransportNeeded(entity.isDefaultTransportNeeded())
                .hasTransportAlternative(entity.isHasTransportAlternative())
                .preferredPickupZone(entity.getPreferredPickupZone())
                .pickupAddress(entity.getPickupAddress())
                .pickupLat(entity.getPickupLat())
                .pickupLng(entity.getPickupLng())
                .wheelchairRequired(entity.isWheelchairRequired())
                .notes(entity.getNotes())
                .build();
    }
}
