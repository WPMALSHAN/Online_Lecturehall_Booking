package com.example.demo.repository;

import com.example.demo.entity.Incident;
import com.example.demo.entity.IncidentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentAttachmentRepository extends JpaRepository<IncidentAttachment, Long> {
    List<IncidentAttachment> findByIncident(Incident incident);
    long countByIncident(Incident incident);
}

