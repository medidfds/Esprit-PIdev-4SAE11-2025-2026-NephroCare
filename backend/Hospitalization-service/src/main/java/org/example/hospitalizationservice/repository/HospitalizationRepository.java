package org.example.hospitalizationservice.repository;

import org.example.hospitalizationservice.entities.Hospitalization;
import org.example.hospitalizationservice.entities.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalizationRepository extends JpaRepository<Hospitalization, Long> {

    List<Hospitalization> findByUserId(String userId);

    List<Hospitalization> findByStatus(String status);

    List<Hospitalization> findByRoom(Room room);

    List<Hospitalization> findByRoomId(Long roomId);

    List<Hospitalization> findByAttendingDoctorId(String doctorId);

    // Active or pending for a specific room — used for availability check
    @Query("""
        SELECT h FROM Hospitalization h
        WHERE h.room.id = :roomId
          AND h.status IN ('active', 'pending')
    """)
    List<Hospitalization> findActiveByRoomId(@Param("roomId") Long roomId);

    // All hospitalizations with their room eagerly fetched (avoids N+1)
    @Query("SELECT h FROM Hospitalization h JOIN FETCH h.room")
    List<Hospitalization> findAllWithRoom();
}