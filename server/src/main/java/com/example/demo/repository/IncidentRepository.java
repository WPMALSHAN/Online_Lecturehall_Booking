package com.example.demo.repository;

import com.example.demo.entity.Incident;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByReportedByOrderByCreatedAtDesc(User reportedBy);
    List<Incident> findByAssignedTechnicianOrderByCreatedAtDesc(User assignedTechnician);
    List<Incident> findByStatusOrderByCreatedAtDesc(Incident.Status status);
}

