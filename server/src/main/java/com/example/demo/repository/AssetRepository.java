package com.example.demo.repository;

import com.example.demo.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    // Search by category
    List<Asset> findByCategory(String category);

    // Search by status
    List<Asset> findByStatus(Asset.Status status);

    // Search by location
    List<Asset> findByLocationContainingIgnoreCase(String location);
}