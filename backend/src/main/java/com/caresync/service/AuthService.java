package com.caresync.service;

import com.caresync.dto.AuthResponse;
import com.caresync.dto.LoginRequest;
import com.caresync.dto.RegisterRequest;
import com.caresync.dto.UserResponse;
import com.caresync.exception.EmailAlreadyExistsException;
import com.caresync.exception.InvalidCredentialsException;
import com.caresync.exception.OAuth2AccountConflictException;
import com.caresync.exception.OAuth2AuthenticationProcessingException;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.Patient;
import com.caresync.model.entity.User;
import com.caresync.model.entity.UserOAuthAccount;
import com.caresync.model.enums.Role;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.PatientRepository;
import com.caresync.repository.UserOAuthAccountRepository;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtService;
import com.caresync.security.OAuth2ExchangeCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserOAuthAccountRepository userOAuthAccountRepository;
    private final OAuth2ExchangeCodeService exchangeCodeService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("An account with email " + request.getEmail() + " already exists.");
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        Long patientId = null;
        Long doctorId = null;

        if (savedUser.getRole() == Role.PATIENT) {
            Patient patient = Patient.builder()
                    .user(savedUser)
                    .dateOfBirth(request.getDateOfBirth())
                    .gender(request.getGender())
                    .bloodGroup(request.getBloodGroup())
                    .emergencyContact(request.getEmergencyContact())
                    .medicalHistory(request.getMedicalHistory())
                    .build();
            Patient savedPatient = patientRepository.save(patient);
            patientId = savedPatient.getId();
        } else if (savedUser.getRole() == Role.DOCTOR) {
            Doctor doctor = Doctor.builder()
                    .user(savedUser)
                    .specialization(request.getSpecialization() != null ? request.getSpecialization() : "General Medicine")
                    .qualifications(request.getQualifications() != null ? request.getQualifications() : "MBBS")
                    .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                    .bio(request.getBio())
                    .location(request.getLocation())
                    .consultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : BigDecimal.ZERO)
                    .build();
            Doctor savedDoctor = doctorRepository.save(doctor);
            doctorId = savedDoctor.getId();
        }

        String token = jwtService.generateToken(savedUser);
        UserResponse userResponse = mapToUserResponse(savedUser, patientId, doctorId);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationMs())
                .user(userResponse)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().trim().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException("Invalid email address or password provided.");
        }

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email address or password provided."));

        if (!user.isActive()) {
            throw new InvalidCredentialsException("Your account has been deactivated. Please contact support.");
        }

        Long patientId = patientRepository.findByUserId(user.getId()).map(Patient::getId).orElse(null);
        Long doctorId = doctorRepository.findByUserId(user.getId()).map(Doctor::getId).orElse(null);

        String token = jwtService.generateToken(user);
        UserResponse userResponse = mapToUserResponse(user, patientId, doctorId);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationMs())
                .user(userResponse)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Authenticated user details not found."));

        Long patientId = patientRepository.findByUserId(user.getId()).map(Patient::getId).orElse(null);
        Long doctorId = doctorRepository.findByUserId(user.getId()).map(Doctor::getId).orElse(null);

        return mapToUserResponse(user, patientId, doctorId);
    }

    @Transactional
    public AuthResponse processOAuth2Login(String provider, String providerUserId, String email, String name, Boolean emailVerified) {
        if (providerUserId == null || providerUserId.isBlank()) {
            throw new OAuth2AuthenticationProcessingException("Provider user identifier is missing.");
        }

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationProcessingException("Email address not provided by " + provider + ".");
        }

        if (emailVerified == null || !emailVerified) {
            throw new OAuth2AuthenticationProcessingException("OAuth email address is not verified.");
        }

        String normalizedEmail = email.trim().toLowerCase();

        // Check if an OAuth link exists for this provider and providerUserId
        Optional<UserOAuthAccount> existingOAuth = userOAuthAccountRepository.findByProviderAndProviderUserId(provider, providerUserId);

        User user;
        Long patientId = null;
        Long doctorId = null;

        if (existingOAuth.isPresent()) {
            user = existingOAuth.get().getUser();
            if (!user.isActive()) {
                throw new OAuth2AuthenticationProcessingException("Your account has been deactivated. Please contact support.");
            }
            log.info("Found existing OAuth-linked user [{}] for provider [{}]", user.getEmail(), provider);

            patientId = patientRepository.findByUserId(user.getId()).map(Patient::getId).orElse(null);
            doctorId = doctorRepository.findByUserId(user.getId()).map(Doctor::getId).orElse(null);
        } else {
            // Not linked. Check if user already exists with this email
            Optional<User> existingUserByEmail = userRepository.findByEmail(normalizedEmail);
            if (existingUserByEmail.isPresent()) {
                log.warn("OAuth login rejected: unlinked account with email [{}] exists with password authentication.", normalizedEmail);
                throw new OAuth2AccountConflictException("An account with email " + normalizedEmail + " already exists with password authentication. Please sign in with your email and password.");
            }

            // Create new user with PATIENT role only (Strict: never ADMIN or DOCTOR)
            String resolvedName = (name != null && !name.isBlank()) ? name.trim() : normalizedEmail.split("@")[0];
            User newUser = User.builder()
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .fullName(resolvedName)
                    .role(Role.PATIENT)
                    .active(true)
                    .build();
            User savedUser = userRepository.save(newUser);

            Patient newPatient = Patient.builder()
                    .user(savedUser)
                    .build();
            Patient savedPatient = patientRepository.save(newPatient);
            patientId = savedPatient.getId();

            UserOAuthAccount oAuthAccount = UserOAuthAccount.builder()
                    .user(savedUser)
                    .provider(provider)
                    .providerUserId(providerUserId)
                    .email(normalizedEmail)
                    .build();
            userOAuthAccountRepository.save(oAuthAccount);

            log.info("Registered new PATIENT user [{}] via OAuth provider [{}]", savedUser.getEmail(), provider);
            user = savedUser;
        }

        String token = jwtService.generateToken(user);
        UserResponse userResponse = mapToUserResponse(user, patientId, doctorId);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationMs())
                .user(userResponse)
                .build();
    }

    public AuthResponse exchangeOAuthCode(String code) {
        return exchangeCodeService.exchangeCode(code)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired OAuth exchange code. Please sign in again."));
    }

    private UserResponse mapToUserResponse(User user, Long patientId, Long doctorId) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .patientId(patientId)
                .doctorId(doctorId)
                .build();
    }
}
