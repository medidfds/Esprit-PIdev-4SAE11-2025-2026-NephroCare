package esprit.dialysisreadinesstransportservice.messaging.publisher;

import esprit.dialysisreadinesstransportservice.config.RabbitMqConfig;
import esprit.dialysisreadinesstransportservice.dto.event.ScheduledSessionConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledSessionEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishScheduledSessionConfirmed(ScheduledSessionConfirmedEvent event) {
        log.info("Preparing to publish ScheduledSessionConfirmedEvent for session id: {}", event.getScheduledSessionId());
        
        rabbitTemplate.convertAndSend(
                RabbitMqConfig.EXCHANGE_NAME,
                RabbitMqConfig.ROUTING_KEY,
                event
        );
        
        log.info("Successfully published ScheduledSessionConfirmedEvent to exchange '{}' with routing key '{}'", 
                RabbitMqConfig.EXCHANGE_NAME, RabbitMqConfig.ROUTING_KEY);
    }
}
