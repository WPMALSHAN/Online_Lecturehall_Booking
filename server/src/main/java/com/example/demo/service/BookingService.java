package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingResponse;
import com.example.demo.entity.Booking;
import com.example.demo.entity.Facility;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.FacilityRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
            FacilityRepository facilityRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public BookingResponse createBooking(String email, BookingRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Facility not found with id: " + request.getFacilityId()));

        if (facility.getStatus() == Facility.Status.OUT_OF_SERVICE) {
            throw new IllegalArgumentException("Facility is currently out of service.");
        }

        if (request.getStartTime().isAfter(request.getEndTime())
                || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookings(
                facility.getId(), request.getDate(), request.getStartTime(), request.getEndTime());

        if (!overlappingBookings.isEmpty()) {
            throw new IllegalArgumentException("The facility is already booked during the requested time.");
        }

        Booking booking = Booking.builder()
                .user(user)
                .facility(facility)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .expectedAttendees(request.getExpectedAttendees())
                .status(Booking.Status.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponse(savedBooking);
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getUserBookings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return bookingRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse approveBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        booking.setStatus(Booking.Status.APPROVED);
        Booking savedBooking = bookingRepository.save(booking);

        notificationService.createNotification(
                booking.getUser(),
                "Your booking for " + booking.getFacility().getName() + " has been approved.");

        return mapToResponse(savedBooking);
    }

    public BookingResponse rejectBooking(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        booking.setStatus(Booking.Status.REJECTED);
        booking.setRejectionReason(reason);
        Booking savedBooking = bookingRepository.save(booking);

        notificationService.createNotification(
                booking.getUser(),
                "Your booking for " + booking.getFacility().getName() + " has been rejected. Reason: " + reason);

        return mapToResponse(savedBooking);
    }

    public BookingResponse cancelBooking(Long bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only cancel your own bookings.");
        }

        if (booking.getStatus() == Booking.Status.REJECTED || booking.getStatus() == Booking.Status.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled or rejected.");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponse(savedBooking);
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getName())
                .userEmail(booking.getUser().getEmail())
                .facilityId(booking.getFacility().getId())
                .facilityName(booking.getFacility().getName())
                .facilityLocation(booking.getFacility().getLocation())
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .build();
    }
}
