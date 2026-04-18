package com.project.lostfound.controller;

import com.project.lostfound.model.FoundReport;
import com.project.lostfound.model.Item;
import com.project.lostfound.model.ItemStatus;
import com.project.lostfound.security.UserPrincipal;
import com.project.lostfound.service.ItemService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/items")
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PostMapping
    public ResponseEntity<Item> createLostItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam String category,
            @RequestParam(required = false) String contactInfo,
            @RequestParam String location,
            @RequestParam(required = false) MultipartFile image) {
        return ResponseEntity.ok(itemService.createLostItem(
                principal.getId(),
                name,
                description,
                category,
                contactInfo,
                location,
                image));
    }

    @GetMapping("/my-items")
    public ResponseEntity<List<Item>> myItems(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(itemService.getMyItems(principal.getId()));
    }

    @GetMapping("/others")
    public ResponseEntity<List<Item>> others(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(itemService.getOtherUsersItems(principal.getId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Item>> getAllItems() {
        return ResponseEntity.ok(itemService.getAllItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getItemById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String contactInfo,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) MultipartFile image) {
        return ResponseEntity.ok(itemService.updateItemWithOwnershipCheck(
                id,
                principal.getId(),
                name,
                description,
                category,
                contactInfo,
                location,
                status,
                image));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        itemService.deleteItemWithOwnershipCheck(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/report-found")
    public ResponseEntity<FoundReport> reportFound(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam MultipartFile image,
            @RequestParam String contactInfo) {
        return ResponseEntity.ok(itemService.reportFound(id, principal.getId(), image, contactInfo));
    }
}
