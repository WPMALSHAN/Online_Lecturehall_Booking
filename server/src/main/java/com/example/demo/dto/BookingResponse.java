package com.example.demo.dto;

import com.example.demo.entity.Booking;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class BookingResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    
    private Long facilityId;
    private String facilityName;
    private String facilityLocation;
    
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private int expectedAttendees;
    
    private Booking.Status status;
    private String rejectionReason;
}
