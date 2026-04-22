package esprit.dialysisreadinesstransportservice.mapper;

import esprit.dialysisreadinesstransportservice.dto.readiness.ReadinessResponseDto;
import esprit.dialysisreadinesstransportservice.entity.ReadinessCheck;
import org.springframework.stereotype.Component;

@Component
public class ReadinessMapper {
    public ReadinessResponseDto toDto(ReadinessCheck entity) {
        if (entity == null) return null;
        return ReadinessResponseDto.builder()
                .scheduledSessionId(entity.getScheduledSessionId())
                .readinessStatus(entity.getReadinessStatus())
                .globalScore(entity.getGlobalScore())
                .blockingReason(entity.getBlockingReason())
                .warningReason(entity.getWarningReason())
                .build();
    }
}
