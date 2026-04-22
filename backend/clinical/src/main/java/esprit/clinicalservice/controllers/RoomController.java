package esprit.clinicalservice.controllers;

import esprit.clinicalservice.dtos.RoomDTO;
import esprit.clinicalservice.services.HospitalizationRoomClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clinical/rooms")
public class RoomController {

    private final HospitalizationRoomClient hospitalizationRoomClient;

    public RoomController(HospitalizationRoomClient hospitalizationRoomClient) {
        this.hospitalizationRoomClient = hospitalizationRoomClient;
    }

    @GetMapping
    public ResponseEntity<List<RoomDTO>> getRooms(
            @RequestParam(defaultValue = "false") boolean availableOnly
    ) {
        List<RoomDTO> rooms = availableOnly
                ? hospitalizationRoomClient.getAvailableRooms()
                : hospitalizationRoomClient.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDTO> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(hospitalizationRoomClient.getRoomById(id));
    }
}
