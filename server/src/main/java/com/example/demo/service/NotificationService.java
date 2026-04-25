package com.example.demo.service;

import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository NotificationRepository;
    private final UserRepository userRepository;

    // Get all notifications for logged-in user
    public List<Notification> getMyNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return NotificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // Get only unread notifications
    public List<Notification> getUnreadNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return NotificationRepository.findByUserAndIsReadFalse(user);
    }

    // Count unread notifications
    public long countUnread(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return NotificationRepository.countByUserAndIsReadFalse(user);
    }

    // Mark one notification as read
    public Notification markAsRead(Long notificationId) {
        Notification notification = NotificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notification.setRead(true);
        return NotificationRepository.save(notification);
    }

    // Mark all notifications as read for a user
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> unread = NotificationRepository.findByUserAndIsReadFalse(user);
        unread.forEach(n -> n.setRead(true));
        NotificationRepository.saveAll(unread);
    }

    // Delete a notification
    public void deleteNotification(Long notificationId) {
        Notification notification = NotificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        NotificationRepository.delete(notification);
    }
}