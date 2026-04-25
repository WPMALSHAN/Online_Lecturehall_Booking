package com.example.demo.repository;

import com.example.demo.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    // Search by type (classroom, lab, seminar hall)
    List<Facility> findByType(String type);

    // Search by status
    List<Facility> findByStatus(Facility.Status status);

    // Search by location
    List<Facility> findByLocationContainingIgnoreCase(String location);

    // Filter by minimum capacity
    List<Facility> findByCapacityGreaterThanEqual(int capacity);
}