package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.entity.Booking;
import com.example.demo.entity.Facility;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.FacilityRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // ─── Internal helper: persist a notification ──────────────────────────────
    private void notify(User user, String message) {
        Notification n = Notification.builder()
                .user(user)
                .message(message)
                .build();
        notificationRepository.save(n);
    }

    // Create booking with conflict check
    public Booking createBooking(BookingRequest request, String email) {

        // Get user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get facility
        Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found"));

        // Check facility is active
        if (facility.getStatus() == Facility.Status.OUT_OF_SERVICE) {
            throw new RuntimeException("Facility is out of service");
        }

        // Validate time - end must be after start
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        // ✅ Conflict check - same facility same date overlapping time
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facility,
                request.getDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            // 🔔 Notify the user that the slot is already taken
            notify(user,
                    "⚠️ Booking conflict: " + facility.getName() +
                    " is already booked on " + request.getDate() +
                    " from " + request.getStartTime() + " to " + request.getEndTime() +
                    ". Please choose a different time slot.");

            throw new RuntimeException(
                    "Facility already booked for this time slot. " +
                            "Please choose a different time."
            );
        }

        // Build and save booking
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

        Booking saved = bookingRepository.save(booking);

        // 🔔 Notify user that their booking was submitted successfully
        notify(user,
                "✅ Booking request submitted for " + facility.getName() +
                " on " + request.getDate() +
                " from " + request.getStartTime() + " to " + request.getEndTime() +
                ". Status: PENDING — awaiting admin approval.");

        return saved;
    }

    // Get my bookings
    public List<Booking> getMyBookings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return bookingRepository.findByUser(user);
    }

    // Get all bookings (Admin)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Get pending bookings (Admin)
    public List<Booking> getPendingBookings() {
        return bookingRepository.findByStatus(Booking.Status.PENDING);
    }

    // Approve booking (Admin)
    public Booking approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new RuntimeException("Only pending bookings can be approved");
        }

        booking.setStatus(Booking.Status.APPROVED);
        Booking saved = bookingRepository.save(booking);

        // 🔔 Notify the booking owner
        notify(booking.getUser(),
                "🎉 Your booking for " + booking.getFacility().getName() +
                " on " + booking.getDate() +
                " from " + booking.getStartTime() + " to " + booking.getEndTime() +
                " has been APPROVED.");

        return saved;
    }

    // Reject booking (Admin)
    public Booking rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new RuntimeException("Only pending bookings can be rejected");
        }

        booking.setStatus(Booking.Status.REJECTED);
        booking.setRejectionReason(reason);
        Booking saved = bookingRepository.save(booking);

        // 🔔 Notify the booking owner
        notify(booking.getUser(),
                "❌ Your booking for " + booking.getFacility().getName() +
                " on " + booking.getDate() +
                " from " + booking.getStartTime() + " to " + booking.getEndTime() +
                " has been REJECTED. Reason: " + reason);

        return saved;
    }

    // Cancel booking (User cancels own booking)
    public Booking cancelBooking(Long id, String email) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        // Check this booking belongs to this user
        if (!booking.getUser().getEmail().equals(email)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == Booking.Status.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // 🔔 Notify user of the cancellation
        notify(booking.getUser(),
                "🚫 Your booking for " + booking.getFacility().getName() +
                " on " + booking.getDate() +
                " from " + booking.getStartTime() + " to " + booking.getEndTime() +
                " has been CANCELLED.");

        return saved;
    }

    // Get booking by ID
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }
}