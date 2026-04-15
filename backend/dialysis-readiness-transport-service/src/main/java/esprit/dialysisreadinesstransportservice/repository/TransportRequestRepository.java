package esprit.dialysisreadinesstransportservice.repository;

import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.entity.SharedRideGroup;
import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransportRequestRepository extends JpaRepository<TransportRequest, UUID> {
    Optional<TransportRequest> findByScheduledSessionId(UUID scheduledSessionId);
    List<TransportRequest> findByStatusAndSharedRideGroupIsNull(TransportRequestStatus status);
    List<TransportRequest> findBySharedRideGroup(SharedRideGroup sharedRideGroup);
}
