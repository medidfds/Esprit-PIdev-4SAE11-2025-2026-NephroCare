package esprit.dialysisreadinesstransportservice.mapper;

import esprit.dialysisreadinesstransportservice.dto.ridegroup.SharedRideGroupResponseDto;
import esprit.dialysisreadinesstransportservice.entity.SharedRideGroup;
import org.springframework.stereotype.Component;

@Component
public class SharedRideGroupMapper {
    public SharedRideGroupResponseDto toDto(SharedRideGroup entity) {
        if (entity == null) return null;
        return SharedRideGroupResponseDto.builder()
                .id(entity.getId())
                .day(entity.getDay())
                .shift(entity.getShift())
                .pickupZone(entity.getPickupZone())
                .pickupAddress(entity.getPickupAddress())
                .pickupLat(entity.getPickupLat())
                .pickupLng(entity.getPickupLng())
                .decisionType(entity.getDecisionType())
                .status(entity.getStatus())
                .compatibilityScore(entity.getCompatibilityScore())
                .validatedAt(entity.getValidatedAt())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehicleCode(entity.getVehicle() != null ? entity.getVehicle().getCode() : null)
                .memberCount(entity.getRequests() != null ? entity.getRequests().size() : 0)
                .requiresWheelchair(entity.getRequests() != null && entity.getRequests().stream().anyMatch(esprit.dialysisreadinesstransportservice.entity.TransportRequest::isWheelchairRequired))
                .build();
    }
}
