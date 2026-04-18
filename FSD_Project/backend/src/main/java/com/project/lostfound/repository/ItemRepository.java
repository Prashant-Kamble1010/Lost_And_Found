package com.project.lostfound.repository;

import com.project.lostfound.model.Item;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);

    @Query(
            "SELECT i FROM Item i WHERE "
                    + "(i.createdBy IS NOT NULL AND i.createdBy.id = :uid) "
                    + "OR (i.createdBy IS NULL AND i.legacyOwner IS NOT NULL AND i.legacyOwner.id = :uid) "
                    + "ORDER BY i.createdAt DESC")
    List<Item> findOwnedByUser(@Param("uid") Long userId);

    @Query(
            "SELECT i FROM Item i WHERE NOT ("
                    + "(i.createdBy IS NOT NULL AND i.createdBy.id = :uid) "
                    + "OR (i.createdBy IS NULL AND i.legacyOwner IS NOT NULL AND i.legacyOwner.id = :uid)"
                    + ") ORDER BY i.createdAt DESC")
    List<Item> findNotOwnedByUser(@Param("uid") Long userId);
}
