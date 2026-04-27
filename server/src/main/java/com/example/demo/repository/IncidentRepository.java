package com.example.demo.repository;

import com.example.demo.entity.Incident;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    // Get all incidents reported by a user
    List<Incident> findByReportedBy(User user);

    // Get all incidents by status
    List<Incident> findByStatus(Incident.Status status);

    // Get all incidents assigned to a technician
    List<Incident> findByAssignedTechnician(User technician);

    // Get all incidents by priority
    List<Incident> findByPriority(String priority);
}