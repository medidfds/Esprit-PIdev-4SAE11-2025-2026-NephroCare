package esprit.clinicalservice.clients;

import esprit.clinicalservice.dtos.RoomDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(
        name = "Hospitalization-service",
        url = "${hospitalization.service.base-url:http://localhost:8081}"
)
public interface HospitalizationRoomFeignClient {

    @GetMapping("/api/rooms")
    List<RoomDTO> getAllRooms();

    @GetMapping("/api/rooms/available")
    List<RoomDTO> getAvailableRooms();

    @GetMapping("/api/rooms/{id}")
    RoomDTO getRoomById(@PathVariable("id") Long id);
}
