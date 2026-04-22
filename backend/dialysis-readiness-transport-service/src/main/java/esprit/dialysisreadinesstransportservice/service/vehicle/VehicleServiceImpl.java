package esprit.dialysisreadinesstransportservice.service.vehicle;

import esprit.dialysisreadinesstransportservice.dto.vehicle.CreateVehicleRequestDto;
import esprit.dialysisreadinesstransportservice.dto.vehicle.VehicleResponseDto;
import esprit.dialysisreadinesstransportservice.entity.Vehicle;
import esprit.dialysisreadinesstransportservice.enums.VehicleStatus;
import esprit.dialysisreadinesstransportservice.mapper.VehicleMapper;
import esprit.dialysisreadinesstransportservice.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import esprit.dialysisreadinesstransportservice.dto.vehicle.UpdateVehicleRequestDto;
import esprit.dialysisreadinesstransportservice.exception.BusinessException;
import esprit.dialysisreadinesstransportservice.exception.ResourceNotFoundException;
import esprit.dialysisreadinesstransportservice.repository.SharedRideGroupRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final SharedRideGroupRepository sharedRideGroupRepository;
    private final VehicleMapper mapper;

    @Override
    @Transactional
    public VehicleResponseDto create(CreateVehicleRequestDto request) {
        Vehicle vehicle = Vehicle.builder()
                .code(request.getCode())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 4)
                .wheelchairSupported(request.isWheelchairSupported())
                .status(request.getStatus() != null ? request.getStatus() : VehicleStatus.IDLE)
                .currentLat(request.getCurrentLat())
                .currentLng(request.getCurrentLng())
                .active(request.isActive())
                .build();
        vehicle = vehicleRepository.save(vehicle);
        log.info("Created new Vehicle with ID: {}", vehicle.getId());
        return mapper.toDto(vehicle);
    }

    @Override
    public List<VehicleResponseDto> getAll() {
        return vehicleRepository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponseDto> getActiveVehicles() {
        return vehicleRepository.findAll().stream()
                .filter(v -> v.getStatus() != VehicleStatus.MAINTENANCE)
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VehicleResponseDto update(UUID id, UpdateVehicleRequestDto request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (request.getCode() != null) vehicle.setCode(request.getCode());
        if (request.getCapacity() != null) vehicle.setCapacity(request.getCapacity());
        if (request.getWheelchairSupported() != null) vehicle.setWheelchairSupported(request.getWheelchairSupported());
        if (request.getStatus() != null) vehicle.setStatus(request.getStatus());
        if (request.getCurrentLat() != null) vehicle.setCurrentLat(request.getCurrentLat());
        if (request.getCurrentLng() != null) vehicle.setCurrentLng(request.getCurrentLng());
        if (request.getActive() != null) vehicle.setActive(request.getActive());

        vehicle = vehicleRepository.save(vehicle);
        log.info("Updated Vehicle with ID: {}", id);
        return mapper.toDto(vehicle);
    }

    @Override
    @Transactional
    public VehicleResponseDto toggleActive(UUID id, boolean active) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        vehicle.setActive(active);
        vehicle = vehicleRepository.save(vehicle);
        log.info("Toggled active state to {} for Vehicle with ID: {}", active, id);
        return mapper.toDto(vehicle);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (sharedRideGroupRepository.existsByVehicleId(id)) {
            throw new BusinessException("Cannot delete this vehicle because it is assigned to a shared ride group.");
        }

        vehicleRepository.delete(vehicle);
        log.info("Deleted Vehicle with ID: {}", id);
    }
}
