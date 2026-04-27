package com.example.demo.repository;

import com.example.demo.entity.TechnicianUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianUpdateRepository extends JpaRepository<TechnicianUpdate, Long> {

    // Get all updates for a specific incident
    List<TechnicianUpdate> findByIncidentIdOrderByDateDesc(Long incidentId);
}
