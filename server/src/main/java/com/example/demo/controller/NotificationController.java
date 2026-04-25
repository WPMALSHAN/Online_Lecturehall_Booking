package com.example.demo.controller;

import com.example.demo.entity.Notification;
import com.example.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    // GET /api/notifications
    // Get all my notifications
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication auth) {
        return ResponseEntity.ok(
                notificationService.getMyNotifications(auth.getName())
        );
    }

    // GET /api/notifications/unread
    // Get only unread notifications
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnread(Authentication auth) {
        return ResponseEntity.ok(
                notificationService.getUnreadNotifications(auth.getName())
        );
    }

    // GET /api/notifications/unread/count
    // Get unread notification count (for bell icon)
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> countUnread(Authentication auth) {
        long count = notificationService.countUnread(auth.getName());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // PUT /api/notifications/{id}/read
    // Mark one notification as read
    @PutMapping("/read/{id}")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    // PUT /api/notifications/read-all
    // Mark all notifications as read
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(auth.getName());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    // DELETE /api/notifications/{id}
    // Delete a notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}