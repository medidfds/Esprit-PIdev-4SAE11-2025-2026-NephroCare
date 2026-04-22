package esprit.dialysisreadinesstransportservice.service.ridegroup;

import esprit.dialysisreadinesstransportservice.dto.ridegroup.SharedRideGroupResponseDto;
import esprit.dialysisreadinesstransportservice.entity.SharedRideGroup;
import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.enums.RideDecisionType;
import esprit.dialysisreadinesstransportservice.enums.RideGroupStatus;
import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import esprit.dialysisreadinesstransportservice.exception.BusinessException;
import esprit.dialysisreadinesstransportservice.exception.ResourceNotFoundException;
import esprit.dialysisreadinesstransportservice.mapper.SharedRideGroupMapper;
import esprit.dialysisreadinesstransportservice.repository.SharedRideGroupRepository;
import esprit.dialysisreadinesstransportservice.repository.TransportRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SharedRideGroupServiceImpl implements SharedRideGroupService {

    private final SharedRideGroupRepository groupRepository;
    private final TransportRequestRepository transportRepository;
    private final esprit.dialysisreadinesstransportservice.repository.VehicleRepository vehicleRepository;
    private final SharedRideGroupMapper mapper;

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double MAX_DISTANCE_KM = 5.0;

    private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Double.MAX_VALUE;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    @Override
    @Transactional
    public List<SharedRideGroupResponseDto> proposeGroups() {
        log.info("Starting to propose shared ride groups by geographic proximity...");
        List<TransportRequest> eligibleRequests = transportRepository.findByStatusAndSharedRideGroupIsNull(TransportRequestStatus.CONFIRMED);
        
        Map<String, List<TransportRequest>> buckets = eligibleRequests.stream()
                .filter(req -> req.getSessionDay() != null && req.getShift() != null)
                .collect(Collectors.groupingBy(req -> req.getSessionDay().toString() + "|" + req.getShift().name()));

        List<SharedRideGroup> createdGroups = new ArrayList<>();

        for (List<TransportRequest> bucket : buckets.values()) {
            List<TransportRequest> remaining = new ArrayList<>(bucket);
            
            while (!remaining.isEmpty()) {
                TransportRequest seed = remaining.remove(0);
                List<TransportRequest> currentGroup = new ArrayList<>();
                currentGroup.add(seed);
                
                if (seed.getPickupLat() != null && seed.getPickupLng() != null) {
                    List<TransportRequest> toRemove = new ArrayList<>();
                    for (TransportRequest candidate : remaining) {
                        if (candidate.getPickupLat() != null && candidate.getPickupLng() != null) {
                            double distance = calculateDistance(seed.getPickupLat(), seed.getPickupLng(), candidate.getPickupLat(), candidate.getPickupLng());
                            if (distance <= MAX_DISTANCE_KM) {
                                currentGroup.add(candidate);
                                toRemove.add(candidate);
                            }
                        }
                    }
                    remaining.removeAll(toRemove);
                }
                
                RideDecisionType decision = currentGroup.size() >= 2 ? RideDecisionType.SHARED : RideDecisionType.INDIVIDUAL;
                
                String pickupZone = seed.getPickupZone();
                if (pickupZone == null || pickupZone.isBlank()) {
                    pickupZone = "Home";
                }
                
                SharedRideGroup group = SharedRideGroup.builder()
                        .day(seed.getSessionDay())
                        .shift(seed.getShift())
                        .pickupZone(pickupZone)
                        .pickupAddress(seed.getPickupAddress())
                        .pickupLat(seed.getPickupLat())
                        .pickupLng(seed.getPickupLng())
                        .decisionType(decision)
                        .status(RideGroupStatus.PROPOSED)
                        .compatibilityScore(100.0)
                        .createdAt(LocalDateTime.now())
                        .build();
                
                SharedRideGroup savedGroup = groupRepository.save(group);
                
                for (TransportRequest req : currentGroup) {
                    req.setSharedRideGroup(savedGroup);
                    req.setUpdatedAt(LocalDateTime.now());
                    transportRepository.save(req);
                }
                
                createdGroups.add(savedGroup);
                log.info("Created proposed {} SharedRideGroup id {} with {} requests", decision, savedGroup.getId(), currentGroup.size());
            }
        }
        
        return createdGroups.stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    public List<SharedRideGroupResponseDto> getProposedGroups() {
        return groupRepository.findByStatus(RideGroupStatus.PROPOSED).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SharedRideGroupResponseDto> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SharedRideGroupResponseDto validateGroup(UUID groupId) {
        SharedRideGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        if (group.getStatus() != RideGroupStatus.PROPOSED) {
            throw new BusinessException("Cannot validate group in status: " + group.getStatus());
        }

        group.setStatus(RideGroupStatus.VALIDATED);
        group.setValidatedAt(LocalDateTime.now());

        group = groupRepository.save(group);
        log.info("SharedRideGroup {} validated.", groupId);
        return mapper.toDto(group);
    }

    @Override
    @Transactional
    public SharedRideGroupResponseDto rejectGroup(UUID groupId) {
        SharedRideGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        if (group.getStatus() != RideGroupStatus.PROPOSED) {
            throw new BusinessException("Cannot reject group in status: " + group.getStatus());
        }

        group.setStatus(RideGroupStatus.REJECTED);

        group = groupRepository.save(group);
        
        List<TransportRequest> requests = transportRepository.findBySharedRideGroup(group);
        for (TransportRequest req : requests) {
            req.setSharedRideGroup(null);
            req.setUpdatedAt(LocalDateTime.now());
            transportRepository.save(req);
        }
        
        log.info("SharedRideGroup {} rejected.", groupId);
        return mapper.toDto(group);
    }

    @Override
    @Transactional
    public SharedRideGroupResponseDto assignVehicle(UUID groupId, UUID vehicleId) {
        SharedRideGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        if (group.getStatus() != RideGroupStatus.VALIDATED) {
            throw new BusinessException("Cannot assign vehicle to group in status: " + group.getStatus());
        }

        esprit.dialysisreadinesstransportservice.entity.Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));

        if (!vehicle.isActive()) {
            throw new BusinessException("Vehicle is not active.");
        }

        if (vehicle.getStatus() == esprit.dialysisreadinesstransportservice.enums.VehicleStatus.MAINTENANCE) {
            throw new BusinessException("Vehicle is in maintenance.");
        }

        boolean conflict = groupRepository.existsByVehicleIdAndDayAndShift(vehicleId, group.getDay(), group.getShift());
        if (conflict) {
            throw new BusinessException("Vehicle is already assigned to another shared ride group for the same day and shift.");
        }

        List<TransportRequest> requests = transportRepository.findBySharedRideGroup(group);
        if (vehicle.getCapacity() < requests.size()) {
            throw new BusinessException("Vehicle capacity is insufficient for group size. Required: " + requests.size());
        }

        boolean requiresWheelchair = requests.stream().anyMatch(TransportRequest::isWheelchairRequired);
        if (requiresWheelchair && !vehicle.isWheelchairSupported()) {
            throw new BusinessException("Group requires a wheelchair supported vehicle.");
        }

        group.setVehicle(vehicle);
        vehicle.setStatus(esprit.dialysisreadinesstransportservice.enums.VehicleStatus.ASSIGNED);

        groupRepository.save(group);
        vehicleRepository.save(vehicle);

        log.info("Assigned Vehicle {} to Group {}.", vehicleId, groupId);
        return mapper.toDto(group);
    }

    @Override
    @Transactional
    public SharedRideGroupResponseDto removeVehicleAssignment(UUID groupId) {
        SharedRideGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        if (group.getVehicle() != null) {
            esprit.dialysisreadinesstransportservice.entity.Vehicle vehicle = group.getVehicle();
            vehicle.setStatus(esprit.dialysisreadinesstransportservice.enums.VehicleStatus.IDLE);
            vehicleRepository.save(vehicle);
            
            group.setVehicle(null);
            group = groupRepository.save(group);
            log.info("Removed vehicle assignment from Group {} and set vehicle {} to IDLE.", groupId, vehicle.getId());
        }

        return mapper.toDto(group);
    }

    @Override
    @Transactional
    public void deleteGroup(UUID groupId) {
        SharedRideGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        // Consistency fix: Reset vehicle explicitly in service layer before deleting group
        if (group.getVehicle() != null) {
            esprit.dialysisreadinesstransportservice.entity.Vehicle vehicle = group.getVehicle();
            vehicle.setStatus(esprit.dialysisreadinesstransportservice.enums.VehicleStatus.IDLE);
            vehicleRepository.save(vehicle);
            log.info("Group {} is being deleted. Resetting attached vehicle {} to IDLE.", groupId, vehicle.getId());
        }

        List<TransportRequest> requests = transportRepository.findBySharedRideGroup(group);
        for (TransportRequest req : requests) {
            req.setSharedRideGroup(null);
            req.setStatus(esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus.CONFIRMED);
            req.setUpdatedAt(LocalDateTime.now());
            transportRepository.save(req);
        }

        groupRepository.delete(group);
        log.info("Deleted SharedRideGroup {}", groupId);
    }
}
