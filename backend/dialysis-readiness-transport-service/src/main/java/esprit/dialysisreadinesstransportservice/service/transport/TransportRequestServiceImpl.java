package esprit.dialysisreadinesstransportservice.service.transport;

import esprit.dialysisreadinesstransportservice.dto.transport.ApproveTransportRequestDto;
import esprit.dialysisreadinesstransportservice.dto.transport.RejectTransportRequestDto;
import esprit.dialysisreadinesstransportservice.dto.transport.TransportRequestResponseDto;
import esprit.dialysisreadinesstransportservice.entity.TransportRequest;
import esprit.dialysisreadinesstransportservice.enums.TransportRequestStatus;
import esprit.dialysisreadinesstransportservice.exception.BusinessException;
import esprit.dialysisreadinesstransportservice.exception.ResourceNotFoundException;
import esprit.dialysisreadinesstransportservice.mapper.TransportRequestMapper;
import esprit.dialysisreadinesstransportservice.repository.TransportRequestRepository;
import esprit.dialysisreadinesstransportservice.service.readiness.ReadinessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransportRequestServiceImpl implements TransportRequestService {

    private final TransportRequestRepository repository;
    private final TransportRequestMapper mapper;
    private final ReadinessService readinessService;

    @Override
    public TransportRequestResponseDto getByScheduledSessionId(UUID scheduledSessionId) {
        TransportRequest request = repository.findByScheduledSessionId(scheduledSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found for session id: " + scheduledSessionId));
        return mapper.toDto(request);
    }

    @Override
    public List<TransportRequestResponseDto> getPendingRequests() {
        return repository.findAll().stream()
                .filter(req -> req.getStatus() == TransportRequestStatus.REQUESTED || req.getStatus() == TransportRequestStatus.PENDING_APPROVAL)
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TransportRequestResponseDto approve(UUID transportRequestId, ApproveTransportRequestDto request) {
        TransportRequest req = repository.findById(transportRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found id: " + transportRequestId));

        if (req.getStatus() != TransportRequestStatus.REQUESTED && req.getStatus() != TransportRequestStatus.PENDING_APPROVAL) {
            throw new BusinessException("Cannot approve transport request in status: " + req.getStatus());
        }

        req.setStatus(TransportRequestStatus.CONFIRMED);
        req.setUpdatedAt(LocalDateTime.now());
        
        req = repository.save(req);
        
        readinessService.recompute(req.getScheduledSessionId());
        
        return mapper.toDto(req);
    }

    @Override
    @Transactional
    public TransportRequestResponseDto reject(UUID transportRequestId, RejectTransportRequestDto request) {
        TransportRequest req = repository.findById(transportRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found id: " + transportRequestId));

        if (req.getStatus() != TransportRequestStatus.REQUESTED && req.getStatus() != TransportRequestStatus.PENDING_APPROVAL) {
            throw new BusinessException("Cannot reject transport request in status: " + req.getStatus());
        }
        
        if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
            throw new BusinessException("Rejection reason cannot be empty");
        }

        req.setStatus(TransportRequestStatus.REJECTED);
        req.setRejectionReason(request.getRejectionReason());
        req.setUpdatedAt(LocalDateTime.now());
        
        req = repository.save(req);
        
        readinessService.recompute(req.getScheduledSessionId());
        
        return mapper.toDto(req);
    }
}
