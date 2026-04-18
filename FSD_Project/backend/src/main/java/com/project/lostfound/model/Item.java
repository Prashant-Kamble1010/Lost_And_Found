package com.project.lostfound.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "items")
@Data
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String category;
    private String image; // stored URL/path (ex: /uploads/items/..)
    private String contactInfo;
    private String location;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id")
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private User createdBy;

    /**
     * Older DB rows may still have {@code user_id} populated while {@code created_by_id} is null.
     * Read-only mapping so we can resolve the true owner for notifications and ownership checks.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private User legacyOwner;

    @Enumerated(EnumType.STRING)
    private ItemStatus status; // LOST, FOUND, CLAIMED

    private LocalDateTime createdAt;
}
