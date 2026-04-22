package esprit.clinicalservice.services;

import esprit.clinicalservice.clients.HospitalizationRoomFeignClient;
import esprit.clinicalservice.dtos.RoomDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class HospitalizationRoomClient {

    private static final Logger logger = LoggerFactory.getLogger(HospitalizationRoomClient.class);

    private final HospitalizationRoomFeignClient roomFeignClient;

    public HospitalizationRoomClient(HospitalizationRoomFeignClient roomFeignClient) {
        this.roomFeignClient = roomFeignClient;
    }

    public List<RoomDTO> getAllRooms() {
        try {
            List<RoomDTO> rooms = roomFeignClient.getAllRooms();
            return rooms != null ? rooms : Collections.emptyList();
        } catch (Exception ex) {
            logger.error("Failed to fetch rooms from hospitalization-service", ex);
            return Collections.emptyList();
        }
    }

    public List<RoomDTO> getAvailableRooms() {
        try {
            List<RoomDTO> rooms = roomFeignClient.getAvailableRooms();
            return rooms != null ? rooms : Collections.emptyList();
        } catch (Exception ex) {
            logger.error("Failed to fetch available rooms from hospitalization-service", ex);
            return Collections.emptyList();
        }
    }

    public RoomDTO getRoomById(Long id) {
        return roomFeignClient.getRoomById(id);
    }
}
