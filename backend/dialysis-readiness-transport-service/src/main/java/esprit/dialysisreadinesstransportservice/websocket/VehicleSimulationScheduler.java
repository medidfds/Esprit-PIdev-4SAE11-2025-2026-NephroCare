package esprit.dialysisreadinesstransportservice.websocket;

import esprit.dialysisreadinesstransportservice.dto.vehicle.VehicleLocationDTO;
import esprit.dialysisreadinesstransportservice.entity.SharedRideGroup;
import esprit.dialysisreadinesstransportservice.entity.Vehicle;
import esprit.dialysisreadinesstransportservice.enums.DialysisShift;
import esprit.dialysisreadinesstransportservice.enums.VehicleStatus;
import esprit.dialysisreadinesstransportservice.repository.SharedRideGroupRepository;
import esprit.dialysisreadinesstransportservice.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class VehicleSimulationScheduler {

    private final VehicleRepository vehicleRepository;
    private final SharedRideGroupRepository groupRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();

    @Value("${simulation.force-active:false}")
    private boolean forceActive;

    @Scheduled(fixedRateString = "${simulation.vehicle.interval:5000}")
    @Transactional
    public void simulateVehicleMovement() {
        List<Vehicle> activeVehicles = vehicleRepository.findAll().stream()
                .filter(Vehicle::isActive)
                .filter(v -> v.getStatus() != VehicleStatus.MAINTENANCE)
                .toList();

        if (activeVehicles.isEmpty()) {
            return;
        }

        List<VehicleLocationDTO> locationDTOs = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        for (Vehicle vehicle : activeVehicles) {

            boolean shouldBeOnRoute;

            if (forceActive) {
                // DEMO MODE: skip group assignment requirement entirely.
                // All active, non-maintenance vehicles simulate movement.
                shouldBeOnRoute = true;
                log.debug("[DEMO] Vehicle {} forced ON_ROUTE via simulation.force-active=true", vehicle.getCode());
            } else {
                // PRODUCTION MODE: vehicle must have an assigned group in today's shift window.
                List<SharedRideGroup> groupsForToday = groupRepository.findByVehicleIdAndDay(vehicle.getId(), today);
                shouldBeOnRoute = false;
                for (SharedRideGroup group : groupsForToday) {
                    if (isTimeInShiftWindow(now, group.getShift())) {
                        shouldBeOnRoute = true;
                        break;
                    }
                }
            }

            // Status transitions
            if (shouldBeOnRoute) {
                if (vehicle.getStatus() == VehicleStatus.ASSIGNED || vehicle.getStatus() == VehicleStatus.IDLE) {
                    vehicle.setStatus(VehicleStatus.ON_ROUTE);
                    log.info("Vehicle {} starting its shift. Status changed to ON_ROUTE.", vehicle.getCode());
                }
            } else {
                if (vehicle.getStatus() == VehicleStatus.ON_ROUTE) {
                    vehicle.setStatus(VehicleStatus.IDLE);
                    log.info("Vehicle {} shift ended or no active shift currently. Status reverted to IDLE.", vehicle.getCode());
                }
            }

            // Only simulate movement and publish if ON_ROUTE
            if (vehicle.getStatus() == VehicleStatus.ON_ROUTE) {
                double latOffset = (random.nextDouble() - 0.5) * 0.001; // ~100m
                double lngOffset = (random.nextDouble() - 0.5) * 0.001;

                Double currentLat = vehicle.getCurrentLat() != null ? vehicle.getCurrentLat() : 36.8065;
                Double currentLng = vehicle.getCurrentLng() != null ? vehicle.getCurrentLng() : 10.1815;

                vehicle.setCurrentLat(currentLat + latOffset);
                vehicle.setCurrentLng(currentLng + lngOffset);

                VehicleLocationDTO locationDTO = VehicleLocationDTO.builder()
                        .vehicleId(vehicle.getId())
                        .code(vehicle.getCode())
                        .currentLat(vehicle.getCurrentLat())
                        .currentLng(vehicle.getCurrentLng())
                        .build();

                locationDTOs.add(locationDTO);
            }
        }

        
        // Publish batched list to websocket
        if (!locationDTOs.isEmpty()) {
            messagingTemplate.convertAndSend("/topic/fleet/vehicles", locationDTOs);
        }

        // Save to DB in batch
        vehicleRepository.saveAll(activeVehicles);
    }

    private boolean isTimeInShiftWindow(LocalTime now, DialysisShift shift) {
        if (shift == null) return false;
        
        switch (shift) {
            case MORNING:
                // MORNING: 08:00–12:00
                return !now.isBefore(LocalTime.of(8, 0)) && now.isBefore(LocalTime.of(12, 0));
            case AFTERNOON:
                // AFTERNOON: 13:00–17:00
                return !now.isBefore(LocalTime.of(13, 0)) && now.isBefore(LocalTime.of(17, 0));
            default:
                return false;
        }
    }
}
