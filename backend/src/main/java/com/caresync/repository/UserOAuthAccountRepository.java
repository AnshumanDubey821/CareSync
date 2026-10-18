package com.caresync.repository;

import com.caresync.model.entity.UserOAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserOAuthAccountRepository extends JpaRepository<UserOAuthAccount, Long> {

    Optional<UserOAuthAccount> findByProviderAndProviderUserId(String provider, String providerUserId);

    Optional<UserOAuthAccount> findByUserIdAndProvider(Long userId, String provider);

    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);

    boolean existsByUserIdAndProvider(Long userId, String provider);
}
