package com.evcharge.auth;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {

    Optional<OtpChallenge> findFirstByPhoneE164AndConsumedAtIsNullOrderByCreatedAtDesc(String phoneE164);

    List<OtpChallenge> findByPhoneE164AndConsumedAtIsNull(String phoneE164);

    List<OtpChallenge> findByPhoneE164AndCreatedAtAfterOrderByCreatedAtAsc(String phoneE164, Instant since);
}
