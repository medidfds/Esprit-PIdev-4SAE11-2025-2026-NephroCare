package esprit.dialysisreadinesstransportservice.service.preference;

import esprit.dialysisreadinesstransportservice.dto.preference.PatientTransportPreferenceDto;
import esprit.dialysisreadinesstransportservice.dto.preference.SaveTransportPreferenceRequestDto;
import esprit.dialysisreadinesstransportservice.entity.PatientTransportPreference;
import esprit.dialysisreadinesstransportservice.exception.ResourceNotFoundException;
import esprit.dialysisreadinesstransportservice.mapper.PatientTransportPreferenceMapper;
import esprit.dialysisreadinesstransportservice.repository.PatientTransportPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientTransportPreferenceServiceImpl implements PatientTransportPreferenceService {

    private final PatientTransportPreferenceRepository repository;
    private final PatientTransportPreferenceMapper mapper;

    @Override
    public PatientTransportPreferenceDto getByPatientId(UUID patientId) {
        PatientTransportPreference pref = repository.findByPatientId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Preference not found for patient id: " + patientId));
        return mapper.toDto(pref);
    }

    @Override
    @Transactional
    public PatientTransportPreferenceDto saveOrUpdate(UUID patientId, SaveTransportPreferenceRequestDto request) {
        PatientTransportPreference pref = repository.findByPatientId(patientId).orElse(null);
        if (pref == null) {
            pref = PatientTransportPreference.builder()
                    .patientId(patientId)
                    .createdAt(LocalDateTime.now())
                    .build();
        }
        
        pref.setDefaultTransportNeeded(request.isDefaultTransportNeeded());
        pref.setHasTransportAlternative(request.isHasTransportAlternative());
        pref.setPreferredPickupZone(request.getPreferredPickupZone());
        pref.setPickupAddress(request.getPickupAddress());
        pref.setPickupLat(request.getPickupLat());
        pref.setPickupLng(request.getPickupLng());
        pref.setWheelchairRequired(request.isWheelchairRequired());
        pref.setNotes(request.getNotes());
        pref.setUpdatedAt(LocalDateTime.now());
        
        pref = repository.save(pref);
        return mapper.toDto(pref);
    }
}
