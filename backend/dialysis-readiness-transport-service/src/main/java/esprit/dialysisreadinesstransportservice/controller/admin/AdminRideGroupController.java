package esprit.dialysisreadinesstransportservice.controller.admin;

import esprit.dialysisreadinesstransportservice.dto.ridegroup.SharedRideGroupResponseDto;
import esprit.dialysisreadinesstransportservice.service.ridegroup.SharedRideGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/ride-groups")
@RequiredArgsConstructor
public class AdminRideGroupController {

    private final SharedRideGroupService service;

    @PostMapping("/propose")
    public ResponseEntity<List<SharedRideGroupResponseDto>> proposeGroups() {
        return ResponseEntity.ok(service.proposeGroups());
    }

    @GetMapping("/proposed")
    public ResponseEntity<List<SharedRideGroupResponseDto>> getProposedGroups() {
        return ResponseEntity.ok(service.getProposedGroups());
    }

    @GetMapping
    public ResponseEntity<List<SharedRideGroupResponseDto>> getAllGroups() {
        return ResponseEntity.ok(service.getAllGroups());
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<SharedRideGroupResponseDto> validateGroup(@PathVariable UUID id) {
        return ResponseEntity.ok(service.validateGroup(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<SharedRideGroupResponseDto> rejectGroup(@PathVariable UUID id) {
        return ResponseEntity.ok(service.rejectGroup(id));
    }

    @PutMapping("/{id}/assign-vehicle/{vehicleId}")
    public ResponseEntity<SharedRideGroupResponseDto> assignVehicle(@PathVariable UUID id, @PathVariable UUID vehicleId) {
        return ResponseEntity.ok(service.assignVehicle(id, vehicleId));
    }

    @PutMapping("/{id}/unassign-vehicle")
    public ResponseEntity<SharedRideGroupResponseDto> unassignVehicle(@PathVariable UUID id) {
        return ResponseEntity.ok(service.removeVehicleAssignment(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable UUID id) {
        service.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
