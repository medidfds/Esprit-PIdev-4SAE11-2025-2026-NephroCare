package esprit.clinicalservice.repositories;

import esprit.clinicalservice.entities.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    List<Consultation> findByPatientId(Long patientId);

    List<Consultation> findByDoctorId(Long doctorId);

    List<Consultation> findByMedicalHistoryId(Long medicalHistoryId);
}

