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
        String locFilter = (location != null && !location.trim().isEmpty()) ? location.trim() : null;

        List<Doctor> doctors = doctorRepository.searchDoctors(nameFilter, specFilter, locFilter);
        return doctors.stream()
                .map(this::mapToDoctorResponse)
                .collect(Collectors.toList());
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
