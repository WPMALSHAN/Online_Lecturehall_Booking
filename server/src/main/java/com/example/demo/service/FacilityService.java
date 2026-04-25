package com.example.demo.service;

import com.example.demo.entity.Facility;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;

    // Get all facilities
    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    // Get one facility
    public Facility getFacilityById(Long id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));
    }

    // Create facility (Admin only)
    public Facility createFacility(Facility facility) {
        facility.setStatus(Facility.Status.ACTIVE);
        return facilityRepository.save(facility);
    }

    // Update facility (Admin only)
    public Facility updateFacility(Long id, Facility updated) {
        Facility facility = getFacilityById(id);
        facility.setName(updated.getName());
        facility.setType(updated.getType());
        facility.setCapacity(updated.getCapacity());
        facility.setLocation(updated.getLocation());
        facility.setStatus(updated.getStatus());
        return facilityRepository.save(facility);
    }

    // Delete facility (Admin only)
    public void deleteFacility(Long id) {
        if (!facilityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Facility not found with id: " + id);
        }
        facilityRepository.deleteById(id);
    }

    // Search by type
    public List<Facility> getByType(String type) {
        return facilityRepository.findByType(type);
    }

    // Filter by capacity
    public List<Facility> getByCapacity(int capacity) {
        return facilityRepository.findByCapacityGreaterThanEqual(capacity);
    }

    // Get only active facilities
    public List<Facility> getActiveFacilities() {
        return facilityRepository.findByStatus(Facility.Status.ACTIVE);
    }
}