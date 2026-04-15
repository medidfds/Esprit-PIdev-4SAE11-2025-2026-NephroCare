package esprit.dialysisreadinesstransportservice.service.event;

import esprit.dialysisreadinesstransportservice.config.RabbitMqConfig;
import esprit.dialysisreadinesstransportservice.dto.event.ScheduledSessionConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledSessionEventConsumer {

    private final ScheduledSessionWorkflowInitializer workflowInitializer;

    @RabbitListener(queues = RabbitMqConfig.QUEUE_NAME)
    public void handleScheduledSessionConfirmed(ScheduledSessionConfirmedEvent event) {
        log.info("Successfully received ScheduledSessionConfirmedEvent for session id: {}", event.getScheduledSessionId());
        log.info("Event details - Patient: {}, Day: {}, Shift: {}", event.getPatientId(), event.getDay(), event.getShift());
        
        workflowInitializer.initializeWorkflow(event);
        
        log.info("Consumer processing completed for session id: {}", event.getScheduledSessionId());
    }
}
