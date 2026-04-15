package esprit.dialysisservice.services;

import esprit.dialysisservice.config.RabbitMqConfig;
import esprit.dialysisservice.dtos.event.ScheduledSessionConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishSessionConfirmed(ScheduledSessionConfirmedEvent event) {
        try {
            log.info("Publishing ScheduledSessionConfirmedEvent for session: {}", event.getScheduledSessionId());
            rabbitTemplate.convertAndSend(
                    RabbitMqConfig.EXCHANGE_NAME,
                    RabbitMqConfig.ROUTING_KEY,
                    event
            );
            log.info("Successfully published event for session: {}", event.getScheduledSessionId());
        } catch (Exception e) {
            log.error("Failed to publish ScheduledSessionConfirmedEvent for session: {}", event.getScheduledSessionId(), e);
        }
    }
}
