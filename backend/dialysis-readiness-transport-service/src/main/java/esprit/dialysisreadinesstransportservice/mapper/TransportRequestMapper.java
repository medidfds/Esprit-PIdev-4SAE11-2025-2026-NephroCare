package esprit.dialysisreadinesstransportservice.mapper;

import esprit.dialysisreadinesstransportservice.dto.transport.TransportRequestResponseDto;
import esprit.dialysisreadinesstransportservice.entity.SharedRideGroup;
import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.entity.Vehicle;
import org.springframework.stereotype.Component;

@Component
public class TransportRequestMapper {
    public TransportRequestResponseDto toDto(TransportRequest entity) {
        if (entity == null) return null;

        String vehicleCode = null;
        String groupStatus = null;

        SharedRideGroup group = entity.getSharedRideGroup();
        if (group != null) {
            groupStatus = group.getStatus() != null ? group.getStatus().name() : null;
            Vehicle vehicle = group.getVehicle();
            if (vehicle != null) {
                vehicleCode = vehicle.getCode();
            }
        }

        return TransportRequestResponseDto.builder()
                .id(entity.getId())
                .scheduledSessionId(entity.getScheduledSessionId())
                .patientId(entity.getPatientId())
                .status(entity.getStatus())
                .pickupZone(entity.getPickupZone())
                .pickupAddress(entity.getPickupAddress())
                .pickupLat(entity.getPickupLat())
                .pickupLng(entity.getPickupLng())
                .wheelchairRequired(entity.isWheelchairRequired())
                .rejectionReason(entity.getRejectionReason())
                .assignedVehicleCode(vehicleCode)
                .assignedGroupStatus(groupStatus)
                .build();
    }
}

