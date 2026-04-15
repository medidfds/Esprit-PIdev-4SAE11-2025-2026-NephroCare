package esprit.dialysisreadinesstransportservice.repository;

import esprit.dialysisreadinesstransportservice.entity.PatientTransportPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientTransportPreferenceRepository extends JpaRepository<PatientTransportPreference, UUID> {
    Optional<PatientTransportPreference> findByPatientId(UUID patientId);
}
