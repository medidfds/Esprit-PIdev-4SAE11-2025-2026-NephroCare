package esprit.dialysisreadinesstransportservice.repository;

import esprit.dialysisreadinesstransportservice.entity.SharedRideGroup;
import esprit.dialysisreadinesstransportservice.enums.RideGroupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import esprit.dialysisreadinesstransportservice.enums.DialysisShift;

@Repository
public interface SharedRideGroupRepository extends JpaRepository<SharedRideGroup, UUID> {
    List<SharedRideGroup> findByStatus(RideGroupStatus status);
    boolean existsByVehicleId(UUID vehicleId);
    boolean existsByVehicleIdAndDayAndShift(UUID vehicleId, LocalDate day, DialysisShift shift);
    List<SharedRideGroup> findByVehicleIdAndDay(UUID vehicleId, LocalDate day);
}
