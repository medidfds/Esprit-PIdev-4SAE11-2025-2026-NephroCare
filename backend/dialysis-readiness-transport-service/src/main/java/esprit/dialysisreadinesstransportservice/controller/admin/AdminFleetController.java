package esprit.dialysisreadinesstransportservice.controller.admin;

import esprit.dialysisreadinesstransportservice.dto.vehicle.VehicleResponseDto;
import esprit.dialysisreadinesstransportservice.service.vehicle.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import esprit.dialysisreadinesstransportservice.dto.vehicle.CreateVehicleRequestDto;

@RestController
@RequestMapping("/api/admin/fleet")
@RequiredArgsConstructor
public class AdminFleetController {

    private final VehicleService service;

    @PostMapping("/vehicles")
    public ResponseEntity<VehicleResponseDto> createVehicle(@RequestBody CreateVehicleRequestDto request) {
        return ResponseEntity.ok(service.create(request));
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleResponseDto>> getAllVehicles() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/vehicles/active")
    public ResponseEntity<List<VehicleResponseDto>> getActiveVehicles() {
        return ResponseEntity.ok(service.getActiveVehicles());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<List<VehicleResponseDto>> getFleetDashboard() {
        return ResponseEntity.ok(service.getActiveVehicles());
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<VehicleResponseDto> updateVehicle(
            @PathVariable java.util.UUID id,
            @RequestBody esprit.dialysisreadinesstransportservice.dto.vehicle.UpdateVehicleRequestDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/vehicles/{id}/active")
    public ResponseEntity<VehicleResponseDto> toggleVehicleActive(
            @PathVariable java.util.UUID id,
            @RequestBody esprit.dialysisreadinesstransportservice.dto.vehicle.ToggleActiveRequestDto request) {
        return ResponseEntity.ok(service.toggleActive(id, request.isActive()));
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable java.util.UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
