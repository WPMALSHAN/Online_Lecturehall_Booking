package com.example.demo.repository;

import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Get all notifications for a specific user
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // Get only unread notifications for a user
    List<Notification> findByUserAndIsReadFalse(User user);

    // Count unread notifications
    long countByUserAndIsReadFalse(User user);
}