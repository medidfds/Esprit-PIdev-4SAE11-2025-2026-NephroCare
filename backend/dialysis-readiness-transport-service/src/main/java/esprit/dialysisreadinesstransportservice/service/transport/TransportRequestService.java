package esprit.dialysisreadinesstransportservice.service.transport;

import esprit.dialysisreadinesstransportservice.dto.transport.ApproveTransportRequestDto;
import esprit.dialysisreadinesstransportservice.dto.transport.RejectTransportRequestDto;
import esprit.dialysisreadinesstransportservice.dto.transport.TransportRequestResponseDto;

import java.util.List;
import java.util.UUID;

public interface TransportRequestService {
    TransportRequestResponseDto getByScheduledSessionId(UUID scheduledSessionId);
    List<TransportRequestResponseDto> getPendingRequests();
    TransportRequestResponseDto approve(UUID transportRequestId, ApproveTransportRequestDto request);
    TransportRequestResponseDto reject(UUID transportRequestId, RejectTransportRequestDto request);
}
