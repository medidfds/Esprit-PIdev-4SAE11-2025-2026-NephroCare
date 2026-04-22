package esprit.dialysisreadinesstransportservice.service.preference;

import esprit.dialysisreadinesstransportservice.dto.preference.PatientTransportPreferenceDto;
import esprit.dialysisreadinesstransportservice.dto.preference.SaveTransportPreferenceRequestDto;

import java.util.UUID;

public interface PatientTransportPreferenceService {
    PatientTransportPreferenceDto getByPatientId(UUID patientId);
    PatientTransportPreferenceDto saveOrUpdate(UUID patientId, SaveTransportPreferenceRequestDto request);
}
