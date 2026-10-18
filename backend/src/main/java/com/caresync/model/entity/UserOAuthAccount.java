package com.caresync.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_oauth_accounts", uniqueConstraints = {
    @UniqueConstraint(name = "uk_provider_user", columnNames = {"provider", "provider_user_id"}),
    @UniqueConstraint(name = "uk_user_provider", columnNames = {"user_id", "provider"})
}, indexes = {
    @Index(name = "idx_oauth_user_id", columnList = "user_id"),
    @Index(name = "idx_oauth_provider_user", columnList = "provider, provider_user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOAuthAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
