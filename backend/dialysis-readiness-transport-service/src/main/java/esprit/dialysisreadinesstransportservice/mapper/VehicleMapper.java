package esprit.dialysisreadinesstransportservice.mapper;

import esprit.dialysisreadinesstransportservice.dto.vehicle.VehicleResponseDto;
import esprit.dialysisreadinesstransportservice.entity.Vehicle;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {
    public VehicleResponseDto toDto(Vehicle entity) {
        if (entity == null) return null;
        return VehicleResponseDto.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .capacity(entity.getCapacity())
                .wheelchairSupported(entity.isWheelchairSupported())
                .status(entity.getStatus())
                .currentLat(entity.getCurrentLat())
                .currentLng(entity.getCurrentLng())
                .active(entity.isActive())
                .build();
    }
}
