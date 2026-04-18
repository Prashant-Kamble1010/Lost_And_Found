package com.project.lostfound.repository;

import com.project.lostfound.model.FoundReport;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FoundReportRepository extends JpaRepository<FoundReport, Long> {
    List<FoundReport> findByItemIdOrderByCreatedAtDesc(Long itemId);

    @Modifying
    @Query("delete from FoundReport fr where fr.item.id = :itemId")
    int deleteAllByItemId(@Param("itemId") Long itemId);
}

