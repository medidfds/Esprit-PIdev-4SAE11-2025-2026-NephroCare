package esprit.pharmacy_service.repository;

import esprit.pharmacy_service.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, String> {
    List<Prescription> findByUserId(String userId);
}
