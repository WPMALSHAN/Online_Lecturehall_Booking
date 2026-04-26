package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.IncidentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Get all users (Admin only)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get one user by ID
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    // Update user role (Admin only)
    public User updateRole(Long id, String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setRole(User.Role.valueOf(newRole.toUpperCase()));
        return userRepository.save(user);
    }

    // Block a user account (Admin only)
    public User blockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getRole() == User.Role.ADMIN) {
            throw new RuntimeException("Admin accounts cannot be blocked");
        }

        user.setBlocked(true);
        User saved = userRepository.save(user);

        // 📧 Send email notification — fail silently so the block action always succeeds
        try {
            emailService.sendAccountBlocked(saved.getEmail(), saved.getName() != null ? saved.getName() : "User");
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send block email to " + saved.getEmail() + ": " + e.getMessage());
        }

        return saved;
    }

    // Unblock a user account (Admin only)
    public User unblockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setBlocked(false);
        User saved = userRepository.save(user);

        // 📧 Send email notification — fail silently so the unblock action always succeeds
        try {
            emailService.sendAccountUnblocked(saved.getEmail(), saved.getName() != null ? saved.getName() : "User");
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send unblock email to " + saved.getEmail() + ": " + e.getMessage());
        }

        return saved;
    }

    // Get users by role (Admin only)
    public List<User> getUsersByRole(String role) {
        User.Role parsedRole = User.Role.valueOf(role.toUpperCase());
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == parsedRole)
                .toList();
    }

    // Update user details
    public User updateUser(Long id, String name, String email) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (name != null && !name.isBlank())  user.setName(name);
        if (email != null && !email.isBlank()) user.setEmail(email);

        return userRepository.save(user);
    }

    // Delete user (Admin only)
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        userRepository.delete(user);
    }

    // Get logged in user profile
    public User getMyProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Change password
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // Admin dashboard summary counts
    public Map<String, Object> getAdminDashboardSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();

        summary.put("totalUsers", userRepository.count());
        summary.put("totalStudents", userRepository.findAll().stream().filter(u -> u.getRole() == User.Role.STUDENT).count());
        summary.put("totalLecturers", userRepository.findAll().stream().filter(u -> u.getRole() == User.Role.LECTURER).count());
        summary.put("totalTechnicians", userRepository.findAll().stream().filter(u -> u.getRole() == User.Role.TECHNICIAN).count());
        summary.put("totalAdmins", userRepository.findAll().stream().filter(u -> u.getRole() == User.Role.ADMIN).count());

        summary.put("totalIncidents", incidentRepository.count());
        summary.put("openIncidents", incidentRepository.findByStatus(com.example.demo.entity.Incident.Status.OPEN).size());
        summary.put("inProgressIncidents", incidentRepository.findByStatus(com.example.demo.entity.Incident.Status.IN_PROGRESS).size());
        summary.put("resolvedIncidents", incidentRepository.findByStatus(com.example.demo.entity.Incident.Status.RESOLVED).size());

        summary.put("totalBookings", bookingRepository.count());
        summary.put("pendingBookings", bookingRepository.findByStatus(com.example.demo.entity.Booking.Status.PENDING).size());
        summary.put("approvedBookings", bookingRepository.findByStatus(com.example.demo.entity.Booking.Status.APPROVED).size());

        return summary;
    }
}