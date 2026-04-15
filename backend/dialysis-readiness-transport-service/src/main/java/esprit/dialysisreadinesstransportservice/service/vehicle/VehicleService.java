package esprit.dialysisreadinesstransportservice.service.vehicle;

import esprit.dialysisreadinesstransportservice.dto.vehicle.CreateVehicleRequestDto;
import esprit.dialysisreadinesstransportservice.dto.vehicle.VehicleResponseDto;
import java.util.List;

public interface VehicleService {
    VehicleResponseDto create(CreateVehicleRequestDto request);
    VehicleResponseDto update(java.util.UUID id, esprit.dialysisreadinesstransportservice.dto.vehicle.UpdateVehicleRequestDto request);
    VehicleResponseDto toggleActive(java.util.UUID id, boolean active);
    void delete(java.util.UUID id);
    List<VehicleResponseDto> getAll();
    List<VehicleResponseDto> getActiveVehicles();
}
