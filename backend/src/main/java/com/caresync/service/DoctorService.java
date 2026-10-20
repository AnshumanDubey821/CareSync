package com.caresync.service;

import com.caresync.dto.DoctorResponse;
import com.caresync.dto.UpdateDoctorProfileRequest;
import com.caresync.exception.ResourceNotFoundException;
import com.caresync.model.entity.Doctor;
import com.caresync.model.entity.User;
import com.caresync.repository.DoctorRepository;
import com.caresync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DoctorResponse> searchDoctors(String name, String specialization, String location) {
        String nameFilter = (name != null && !name.trim().isEmpty()) ? name.trim() : null;
        String specFilter = (specialization != null && !specialization.trim().isEmpty()) ? specialization.trim() : null;
        String locFilter = normalizeLocation(location);

        List<Doctor> doctors = doctorRepository.searchDoctors(nameFilter, specFilter, locFilter);

        // Fallback: If no doctors match the exact location string, attempt keyword matching on known hospital networks or city
        if (doctors.isEmpty() && locFilter != null) {
            String fallbackKeyword = extractLocationKeyword(locFilter);
            if (fallbackKeyword != null && !fallbackKeyword.equalsIgnoreCase(locFilter)) {
                doctors = doctorRepository.searchDoctors(nameFilter, specFilter, fallbackKeyword);
            }
        }

        return doctors.stream()
                .map(this::mapToDoctorResponse)
                .collect(Collectors.toList());
    }

    private String normalizeLocation(String rawLocation) {
        if (rawLocation == null || rawLocation.trim().isEmpty()) {
            return null;
        }
        String loc = rawLocation.trim();
        // Handle Delhi NCR alias
        if (loc.equalsIgnoreCase("Delhi NCR") || loc.equalsIgnoreCase("Delhi-NCR")) {
            return "Delhi";
        }
        if (loc.equalsIgnoreCase("Bangalore")) {
            return "Bengaluru";
        }
        // If Google Places title contains pipe (e.g. "Apollo Hospitals | Best Hospital in Bannerghatta Road, Bengaluru")
        if (loc.contains("|")) {
            String primary = loc.split("\\|")[0].trim();
            if (!primary.isEmpty()) {
                return primary;
            }
        }
        return loc;
    }

    private String extractLocationKeyword(String location) {
        if (location == null) return null;
        String lower = location.toLowerCase();

        // Check common hospital brands
        if (lower.contains("apollo")) return "Apollo";
        if (lower.contains("fortis")) return "Fortis";
        if (lower.contains("max super") || lower.contains("max health") || lower.contains("max hospital")) return "Max";
        if (lower.contains("manipal")) return "Manipal";
        if (lower.contains("medanta")) return "Medanta";
        if (lower.contains("kokilaben")) return "Kokilaben";
        if (lower.contains("ruby hall")) return "Ruby Hall";
        if (lower.contains("ganga ram")) return "Ganga Ram";

        // Check major cities
        if (lower.contains("delhi")) return "Delhi";
        if (lower.contains("bengaluru") || lower.contains("bangalore")) return "Bengaluru";
        if (lower.contains("mumbai")) return "Mumbai";
        if (lower.contains("hyderabad")) return "Hyderabad";
        if (lower.contains("chennai")) return "Chennai";
        if (lower.contains("pune")) return "Pune";
        if (lower.contains("kolkata")) return "Kolkata";
        if (lower.contains("gurugram") || lower.contains("gurgaon")) return "Gurugram";

        return null;
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found with ID: " + doctorId));
        return mapToDoctorResponse(doctor);
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorProfileByEmail(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not registered for this user account."));
        return mapToDoctorResponse(doctor);
    }

    @Transactional
    public DoctorResponse updateDoctorProfile(String userEmail, UpdateDoctorProfileRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not registered for this user account."));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        userRepository.save(user);

        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setQualifications(request.getQualifications().trim());
        if (request.getExperienceYears() != null) {
            doctor.setExperienceYears(request.getExperienceYears());
        }
        doctor.setBio(request.getBio());
        doctor.setLocation(request.getLocation());
        doctor.setConsultationFee(request.getConsultationFee());

        Doctor updated = doctorRepository.save(doctor);
        return mapToDoctorResponse(updated);
    }

    public DoctorResponse mapToDoctorResponse(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .userId(doctor.getUser().getId())
                .fullName(doctor.getUser().getFullName())
                .email(doctor.getUser().getEmail())
                .phoneNumber(doctor.getUser().getPhoneNumber())
                .specialization(doctor.getSpecialization())
                .qualifications(doctor.getQualifications())
                .experienceYears(doctor.getExperienceYears())
                .bio(doctor.getBio())
                .location(doctor.getLocation())
                .consultationFee(doctor.getConsultationFee())
                .build();
    }
}
