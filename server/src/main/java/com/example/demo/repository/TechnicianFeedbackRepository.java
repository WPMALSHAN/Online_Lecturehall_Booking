package com.example.demo.repository;

import com.example.demo.entity.TechnicianFeedback;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianFeedbackRepository extends JpaRepository<TechnicianFeedback, Long> {

    // All feedback for a specific technician (newest first)
    List<TechnicianFeedback> findByTechnicianOrderByCreatedAtDesc(User technician);

    // Check if feedback already exists for this incident (prevent duplicates)
    Optional<TechnicianFeedback> findByIncidentId(Long incidentId);

    // Average rating for a technician
    @Query("SELECT AVG(f.rating) FROM TechnicianFeedback f WHERE f.technician = :technician")
    Double findAverageRatingByTechnician(@Param("technician") User technician);

    // Count feedback entries for a technician
    long countByTechnician(User technician);
}
