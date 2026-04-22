package esprit.dialysisreadinesstransportservice.client;

import esprit.dialysisreadinesstransportservice.dto.client.AlertRequestDTO;
import esprit.dialysisreadinesstransportservice.dto.client.ScheduledSessionDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(
        name = "dialysis-service",
        url = "${dialysis-service.base-url:http://localhost:8075}"
)
public interface DialysisServiceFeignClient {

    @GetMapping("/api/schedule/internal/{id}")
    ScheduledSessionDto getScheduledSession(@PathVariable("id") UUID scheduledSessionId);

    @PostMapping("/api/alerts/internal")
    void createAlert(@RequestBody AlertRequestDTO dto);
}
