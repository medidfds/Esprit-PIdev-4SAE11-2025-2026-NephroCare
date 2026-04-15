package esprit.dialysisreadinesstransportservice.service.ridegroup;

import esprit.dialysisreadinesstransportservice.dto.ridegroup.SharedRideGroupResponseDto;
import java.util.List;
import java.util.UUID;

public interface SharedRideGroupService {
    List<SharedRideGroupResponseDto> proposeGroups();
    List<SharedRideGroupResponseDto> getProposedGroups();
    List<SharedRideGroupResponseDto> getAllGroups();
    SharedRideGroupResponseDto validateGroup(UUID groupId);
    SharedRideGroupResponseDto rejectGroup(UUID groupId);
    SharedRideGroupResponseDto assignVehicle(UUID groupId, UUID vehicleId);
    SharedRideGroupResponseDto removeVehicleAssignment(UUID groupId);
    void deleteGroup(UUID groupId);
}
