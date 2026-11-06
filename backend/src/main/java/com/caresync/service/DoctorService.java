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
        if (lower.contains("max super") || lower.contains("max health") || lower.contains("max hospital") || lower.contains("blk-max")) return "Max";
        if (lower.contains("manipal")) return "Manipal";
        if (lower.contains("medanta")) return "Medanta";
        if (lower.contains("kokilaben")) return "Kokilaben";
        if (lower.contains("ruby hall")) return "Ruby Hall";
        if (lower.contains("ganga ram")) return "Ganga Ram";
        if (lower.contains("aiims")) return "AIIMS";
        if (lower.contains("lilavati")) return "Lilavati";
        if (lower.contains("tata memorial")) return "Tata Memorial";
        if (lower.contains("reliance")) return "Reliance";
        if (lower.contains("narayana")) return "Narayana";
        if (lower.contains("aster")) return "Aster";
        if (lower.contains("yashoda")) return "Yashoda";
        if (lower.contains("kims")) return "KIMS";
        if (lower.contains("care hospital")) return "Care";
        if (lower.contains("gleneagles")) return "Gleneagles";
        if (lower.contains("miot")) return "MIOT";
        if (lower.contains("jehangir")) return "Jehangir";
        if (lower.contains("sahyadri")) return "Sahyadri";
        if (lower.contains("zydus")) return "Zydus";
        if (lower.contains("cims") || lower.contains("marengo")) return "CIMS";
        if (lower.contains("amrita")) return "Amrita";
        if (lower.contains("pgimer")) return "PGIMER";

        // Check major cities
        if (lower.contains("delhi")) return "Delhi";
        if (lower.contains("bengaluru") || lower.contains("bangalore")) return "Bengaluru";
        if (lower.contains("mumbai")) return "Mumbai";
        if (lower.contains("hyderabad")) return "Hyderabad";
        if (lower.contains("chennai")) return "Chennai";
        if (lower.contains("pune")) return "Pune";
        if (lower.contains("kolkata")) return "Kolkata";
        if (lower.contains("gurugram") || lower.contains("gurgaon")) return "Gurugram";
        if (lower.contains("ahmedabad")) return "Ahmedabad";
        if (lower.contains("jaipur")) return "Jaipur";
        if (lower.contains("lucknow")) return "Lucknow";
        if (lower.contains("kochi")) return "Kochi";
        if (lower.contains("mohali")) return "Mohali";
        if (lower.contains("chandigarh")) return "Chandigarh";
        if (lower.contains("indore")) return "Indore";

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

    record HospitalCoord(String name, double lat, double lng) {}

    private HospitalCoord resolveHospitalCoordinate(String location) {
        if (location == null) return null;
        String lower = location.toLowerCase();

        // 1. Specific Fortis branches
        if (lower.contains("fortis") && (lower.contains("mohali") || lower.contains("sector 62") || lower.contains("punjab"))) {
            return new HospitalCoord("Fortis Hospital, Mohali", 30.7046, 76.7179);
        }
        if (lower.contains("fortis") && (lower.contains("malar") || lower.contains("adyar"))) {
            return new HospitalCoord("Fortis Malar Hospital, Adyar, Chennai", 13.0067, 80.2569);
        }
        if (lower.contains("fortis") && (lower.contains("anandapur") || (lower.contains("kolkata") && lower.contains("bypass")))) {
            return new HospitalCoord("Fortis Hospital Anandapur, Kolkata", 22.5186, 88.4011);
        }
        if (lower.contains("fortis") && (lower.contains("jaipur") || lower.contains("malviya") || lower.contains("escorts"))) {
            return new HospitalCoord("Fortis Escorts Hospital, Malviya Nagar, Jaipur", 26.8488, 75.8038);
        }
        if (lower.contains("fortis") && lower.contains("bannerghatta")) {
            return new HospitalCoord("Fortis Hospital, Bannerghatta Road, Bengaluru", 12.8943, 77.5978);
        }
        if (lower.contains("fortis") && (lower.contains("sector 44") || lower.contains("gurugram") || lower.contains("memorial") || lower.contains("gurgaon"))) {
            return new HospitalCoord("Fortis Memorial Research Institute, Gurugram", 28.4554, 77.0722);
        }

        // 2. Specific Medanta branches
        if (lower.contains("medanta") && (lower.contains("lucknow") || lower.contains("shaheed path"))) {
            return new HospitalCoord("Medanta Hospital, Lucknow", 26.7909, 80.9780);
        }
        if (lower.contains("medanta") && (lower.contains("indore") || lower.contains("vijay nagar"))) {
            return new HospitalCoord("Medanta Super Speciality Hospital, Indore", 22.7533, 75.8937);
        }
        if (lower.contains("medanta")) {
            return new HospitalCoord("Medanta - The Medicity, Gurugram", 28.4393, 77.0427);
        }

        // 3. Specific Manipal branches
        if (lower.contains("manipal") && (lower.contains("salt lake") || lower.contains("kolkata") || lower.contains("broadway"))) {
            return new HospitalCoord("Manipal Hospital, Salt Lake", 22.5701, 88.4068);
        }
        if (lower.contains("manipal") && (lower.contains("jaipur") || lower.contains("vidhyadhar"))) {
            return new HospitalCoord("Manipal Hospital, Vidhyadhar Nagar, Jaipur", 26.9698, 75.7761);
        }
        if (lower.contains("manipal") && (lower.contains("airport") || lower.contains("bengaluru") || lower.contains("kodihalli"))) {
            return new HospitalCoord("Manipal Hospital, Old Airport Road", 12.9585, 77.6483);
        }

        // 4. Specific Apollo branches
        if (lower.contains("apollomedics") || (lower.contains("apollo") && (lower.contains("lucknow") || lower.contains("bargawan") || lower.contains("lda")))) {
            return new HospitalCoord("Apollomedics Super Speciality Hospital, Lucknow", 26.7915, 80.8953);
        }
        if (lower.contains("indraprastha") || (lower.contains("apollo") && (lower.contains("sarita vihar") || lower.contains("mathura road")))) {
            return new HospitalCoord("Indraprastha Apollo Hospitals, Sarita Vihar", 28.5385, 77.2847);
        }
        if (lower.contains("apollo") && (lower.contains("ahmedabad") || lower.contains("gandhinagar") || lower.contains("bhat"))) {
            return new HospitalCoord("Apollo Hospitals International, Ahmedabad", 23.1092, 72.6105);
        }
        if (lower.contains("apollo") && (lower.contains("kolkata") || lower.contains("canal circular") || lower.contains("kadapara"))) {
            return new HospitalCoord("Apollo Multispeciality Hospitals, Kolkata", 22.5732, 88.3995);
        }
        if (lower.contains("apollo") && (lower.contains("jubilee") || lower.contains("hyderabad") || lower.contains("health city"))) {
            return new HospitalCoord("Apollo Health City, Jubilee Hills", 17.4193, 78.4116);
        }
        if (lower.contains("apollo") && (lower.contains("teynampet") || lower.contains("chennai") || lower.contains("mount"))) {
            return new HospitalCoord("Apollo Speciality Hospitals, Chennai", 13.0368, 80.2483);
        }
        if (lower.contains("apollo") && (lower.contains("bannerghatta") || lower.contains("bengaluru") || lower.contains("indiranagar"))) {
            return new HospitalCoord("Apollo Hospitals, Bannerghatta Road", 12.8962, 77.5986);
        }

        // 5. Specific Max branches
        if (lower.contains("blk") || (lower.contains("max") && (lower.contains("pusa") || lower.contains("karol bagh")))) {
            return new HospitalCoord("BLK-Max Super Speciality Hospital, Karol Bagh", 28.6441, 77.1793);
        }
        if (lower.contains("max") && (lower.contains("saket") || lower.contains("enclave") || lower.contains("delhi"))) {
            return new HospitalCoord("Max Super Speciality Hospital, Saket", 28.5280, 77.2114);
        }

        // 6. Specific Aster branches
        if (lower.contains("aster") && (lower.contains("medcity") || lower.contains("kochi") || lower.contains("chittoor") || lower.contains("cheranalloor"))) {
            return new HospitalCoord("Aster Medcity, Kochi", 10.0536, 76.2697);
        }
        if (lower.contains("aster") && (lower.contains("cmi") || lower.contains("hebbal") || lower.contains("sahakar") || lower.contains("bengaluru"))) {
            return new HospitalCoord("Aster CMI Hospital, Hebbal, Bengaluru", 13.0560, 77.5921);
        }

        // 7. Delhi NCR Medical Centers
        if (lower.contains("aiims") || (lower.contains("all india institute") && lower.contains("ansari"))) {
            return new HospitalCoord("All India Institute of Medical Sciences (AIIMS), New Delhi", 28.5672, 77.2100);
        }
        if (lower.contains("ganga ram")) {
            return new HospitalCoord("Sir Ganga Ram Hospital, Rajinder Nagar", 28.6389, 77.1897);
        }

        // 8. Mumbai Medical Centers
        if (lower.contains("kokilaben") || (lower.contains("ambani") && lower.contains("andheri"))) {
            return new HospitalCoord("Kokilaben Dhirubhai Ambani Hospital, Andheri West", 19.1312, 72.8252);
        }
        if (lower.contains("lilavati")) {
            return new HospitalCoord("Lilavati Hospital and Research Centre, Bandra West", 19.0518, 72.8294);
        }
        if (lower.contains("tata memorial") || (lower.contains("tata") && lower.contains("parel"))) {
            return new HospitalCoord("Tata Memorial Hospital, Parel, Mumbai", 19.0047, 72.8431);
        }
        if (lower.contains("reliance") || lower.contains("h.n.") || lower.contains("hn reliance") || lower.contains("girgaon")) {
            return new HospitalCoord("Sir H.N. Reliance Foundation Hospital, Girgaon, Mumbai", 18.9586, 72.8194);
        }

        // 9. Bengaluru Medical Centers
        if (lower.contains("narayana") || lower.contains("bommasandra")) {
            return new HospitalCoord("Narayana Institute of Cardiac Sciences, Bengaluru", 12.8174, 77.6917);
        }

        // 10. Hyderabad Medical Centers
        if (lower.contains("yashoda")) {
            return new HospitalCoord("Yashoda Hospitals, Somajiguda, Hyderabad", 17.4260, 78.4539);
        }
        if (lower.contains("kims")) {
            return new HospitalCoord("KIMS Hospitals, Secunderabad", 17.4385, 78.4877);
        }
        if (lower.contains("care") && (lower.contains("banjara") || lower.contains("hyderabad"))) {
            return new HospitalCoord("Care Hospitals, Banjara Hills, Hyderabad", 17.4161, 78.4483);
        }

        // 11. Chennai Medical Centers
        if (lower.contains("gleneagles") || lower.contains("global health city") || lower.contains("perumbakkam")) {
            return new HospitalCoord("Gleneagles Global Health City, Chennai", 12.9067, 80.1983);
        }
        if (lower.contains("miot") || lower.contains("manapakkam")) {
            return new HospitalCoord("MIOT International Hospital, Chennai", 13.0232, 80.1772);
        }

        // 12. Pune Medical Centers
        if (lower.contains("ruby hall")) {
            return new HospitalCoord("Ruby Hall Clinic, Pune", 18.5332, 73.8767);
        }
        if (lower.contains("jehangir")) {
            return new HospitalCoord("Jehangir Hospital, Pune", 18.5283, 73.8760);
        }
        if (lower.contains("sahyadri")) {
            return new HospitalCoord("Sahyadri Super Speciality Hospital, Pune", 18.5134, 73.8378);
        }

        // 13. Ahmedabad Medical Centers
        if (lower.contains("zydus") || (lower.contains("thaltej") && lower.contains("ahmedabad"))) {
            return new HospitalCoord("Zydus Hospital, Thaltej, Ahmedabad", 23.0575, 72.5152);
        }
        if (lower.contains("cims") || lower.contains("marengo") || (lower.contains("sola") && lower.contains("science city"))) {
            return new HospitalCoord("Marengo CIMS Hospital, Ahmedabad", 23.0760, 72.5085);
        }

        // 14. Kochi Medical Centers
        if (lower.contains("amrita") || (lower.contains("aims") && lower.contains("kochi")) || lower.contains("edappally")) {
            return new HospitalCoord("Amrita Institute of Medical Sciences (AIMS), Kochi", 10.0326, 76.2917);
        }

        // 15. Chandigarh Medical Centers
        if (lower.contains("pgimer") || lower.contains("post graduate institute") || (lower.contains("sector 12") && lower.contains("chandigarh"))) {
            return new HospitalCoord("Post Graduate Institute of Medical Education & Research (PGIMER), Chandigarh", 30.7651, 76.7758);
        }

        return null;
    }

    public DoctorResponse mapToDoctorResponse(Doctor doctor) {
        HospitalCoord coord = resolveHospitalCoordinate(doctor.getLocation());
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
                .hospitalName(coord != null ? coord.name() : null)
                .latitude(coord != null ? coord.lat() : null)
                .longitude(coord != null ? coord.lng() : null)
                .build();
    }
}
