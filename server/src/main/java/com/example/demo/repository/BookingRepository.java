package com.example.demo.repository;

import com.example.demo.entity.Booking;
import com.example.demo.entity.Facility;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUser(User user);
    List<Booking> findByStatus(Booking.Status status);
    List<Booking> findByFacility(Facility facility);

    // ✅ Fixed - check PENDING and APPROVED both
    @Query("SELECT b FROM Booking b WHERE b.facility = :facility " +
            "AND b.date = :date " +
            "AND (b.status = 'APPROVED' OR b.status = 'PENDING') " +
            "AND b.startTime < :endTime " +
            "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("facility") Facility facility,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}