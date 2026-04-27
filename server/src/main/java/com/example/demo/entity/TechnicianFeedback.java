package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "technician_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The technician who is being rated
    @ManyToOne
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    // The incident this feedback is about
    @ManyToOne
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    // Admin who gave the feedback
    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    // 1-5 star rating
    @Column(nullable = false)
    private int rating;

    // Optional written comment
    @Column(length = 1000)
    private String comment;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
