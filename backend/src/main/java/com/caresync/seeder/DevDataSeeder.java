package com.caresync.seeder;

import com.caresync.model.entity.*;
import com.caresync.model.enums.AppointmentStatus;
import com.caresync.model.enums.Role;
import com.caresync.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(UserRepository userRepository,
                         DoctorRepository doctorRepository,
                         PatientRepository patientRepository,
                         DoctorAvailabilityRepository doctorAvailabilityRepository,
                         AppointmentRepository appointmentRepository,
                         PrescriptionRepository prescriptionRepository,
                         PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.doctorAvailabilityRepository = doctorAvailabilityRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        long userCount = userRepository.count();
        long patientCount = patientRepository.count();
        long doctorCount = doctorRepository.count();

        // Always ensure any existing doctors in the database are distributed across the full 42 hospital network
        if (doctorCount > 0) {
            List<Doctor> existingDoctors = doctorRepository.findAll();
            boolean updated = false;
            for (int i = 0; i < existingDoctors.size(); i++) {
                Doctor d = existingDoctors.get(i);
                String expected = LOCATIONS[i % LOCATIONS.length];
                if (!expected.equalsIgnoreCase(d.getLocation())) {
                    d.setLocation(expected);
                    updated = true;
                }
            }
            if (updated) {
                doctorRepository.saveAll(existingDoctors);
                log.info("Synchronized and distributed {} existing doctors across all {} nationwide hospital hubs.",
                        existingDoctors.size(), LOCATIONS.length);
            }
        }

        if (userCount >= 500 && patientCount >= 400 && doctorCount >= 42) {
            log.info("Development dataset already exists (Users: {}, Doctors: {}, Patients: {}). Skipping initial full seed.",
                    userCount, doctorCount, patientCount);
            return;
        }

        log.info("Starting CareSync Development Data Seeding across 42 healthcare locations...");
        long startTime = System.currentTimeMillis();

        // 1. Hash default password once for speed
        String encodedPassword = passwordEncoder.encode("Password123!");

        // 2. Create Admin Users (5)
        List<User> adminUsers = createAdminUsers(encodedPassword);
        userRepository.saveAll(adminUsers);
        log.info("Seeded {} Admin Users", adminUsers.size());

        // 3. Create Doctor Users & Doctors (50)
        List<Doctor> doctors = createDoctors(encodedPassword);
        log.info("Seeded {} Doctors and associated Users", doctors.size());

        // 4. Create Patient Users & Patients (500)
        List<Patient> patients = createPatients(encodedPassword);
        log.info("Seeded {} Patients and associated Users", patients.size());

        // 5. Create Doctor Availability across 30 days (-15 to +14 days)
        List<DoctorAvailability> availabilities = createDoctorAvailabilities(doctors);
        doctorAvailabilityRepository.saveAll(availabilities);
        log.info("Seeded {} Doctor Availability periods", availabilities.size());

        // 6. Create Appointments (Target: ~1,500 - 2,500)
        List<Appointment> appointments = createAppointments(doctors, patients, availabilities);
        appointmentRepository.saveAll(appointments);
        log.info("Seeded {} Appointments across historical and upcoming dates", appointments.size());

        // 7. Create Prescriptions for Completed Appointments (Target: ~500 - 800)
        List<Prescription> prescriptions = createPrescriptions(appointments);
        prescriptionRepository.saveAll(prescriptions);
        log.info("Seeded {} Prescriptions linked to completed appointments", prescriptions.size());

        long duration = System.currentTimeMillis() - startTime;
        log.info("CareSync Development Data Seeding completed successfully in {} ms!", duration);
    }

    private List<User> createAdminUsers(String password) {
        List<User> admins = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            User admin = User.builder()
                    .email("admin" + i + "@caresync.com")
                    .password(password)
                    .fullName("System Admin " + i)
                    .phoneNumber("+91 98100 0000" + i)
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            admins.add(admin);
        }
        return admins;
    }

    public static final String[] LOCATIONS = {
            // Bengaluru (5)
            "Apollo Hospitals, 154/11 Bannerghatta Road, Indiranagar, Bengaluru, Karnataka",
            "Manipal Hospital, 98 HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka",
            "Narayana Institute of Cardiac Sciences, Bommasandra Industrial Area, Bengaluru, Karnataka",
            "Fortis Hospital, 154/9 Bannerghatta Road, Opposite IIMB, Bengaluru, Karnataka",
            "Aster CMI Hospital, No. 43/42 NH 44, Sahakar Nagar, Hebbal, Bengaluru, Karnataka",

            // Delhi NCR (7)
            "Max Super Speciality Hospital, 1 Press Enclave Road, Saket, New Delhi",
            "Sir Ganga Ram Hospital, Sir Ganga Ram Hospital Marg, Rajinder Nagar, New Delhi",
            "All India Institute of Medical Sciences (AIIMS), Sri Aurobindo Marg, Ansari Nagar, New Delhi",
            "Indraprastha Apollo Hospitals, Delhi-Mathura Road, Sarita Vihar, New Delhi",
            "BLK-Max Super Speciality Hospital, Pusa Road, Karol Bagh, New Delhi",
            "Fortis Memorial Research Institute, Sector 44, Gurugram, Haryana",
            "Medanta - The Medicity, CH Bakhtawar Singh Road, Sector 38, Gurugram, Haryana",

            // Mumbai (4)
            "Kokilaben Dhirubhai Ambani Hospital, Rao Saheb Patwardhan Marg, Andheri West, Mumbai, Maharashtra",
            "Lilavati Hospital and Research Centre, A-791 Bandra Reclamation, Bandra West, Mumbai, Maharashtra",
            "Tata Memorial Hospital, Dr. E Borges Road, Parel, Mumbai, Maharashtra",
            "Sir H.N. Reliance Foundation Hospital, Raja Ram Mohan Roy Road, Prarthana Samaj, Girgaon, Mumbai, Maharashtra",

            // Hyderabad (4)
            "Apollo Health City, Road No 72, Film Nagar, Jubilee Hills, Hyderabad, Telangana",
            "Yashoda Hospitals, Raj Bhavan Road, Matha Nagar, Somajiguda, Hyderabad, Telangana",
            "KIMS Hospitals, 1-8-31/1 Minister Road, Krishna Nagar Colony, Secunderabad, Hyderabad, Telangana",
            "Care Hospitals, Road No 1, Prem Nagar, Banjara Hills, Hyderabad, Telangana",

            // Chennai (4)
            "Apollo Speciality Hospitals, 320 Mount Road, Teynampet, Chennai, Tamil Nadu",
            "Gleneagles Global Health City, 439 Cheran Nagar, Perumbakkam, Chennai, Tamil Nadu",
            "Fortis Malar Hospital, No. 52 1st Main Road, Gandhi Nagar, Adyar, Chennai, Tamil Nadu",
            "MIOT International Hospital, 4/112 Mount Poonamallee High Road, Manapakkam, Chennai, Tamil Nadu",

            // Pune (3)
            "Ruby Hall Clinic, 40 Sassoon Road, Sangamvadi, Pune, Maharashtra",
            "Jehangir Hospital, 32 Sasoon Road, Opposite Railway Station, Pune, Maharashtra",
            "Sahyadri Super Speciality Hospital, Plot No. 30 C, Erandwane, Deccan Gymkhana, Pune, Maharashtra",

            // Kolkata (3)
            "Manipal Hospital, Broadway, IB Block, Sector III, Salt Lake, Kolkata, West Bengal",
            "Apollo Multispeciality Hospitals, 58 Canal Circular Road, Kadapara, Kolkata, West Bengal",
            "Fortis Hospital Anandapur, 730 Anandapur, E.M. Bypass Road, Kolkata, West Bengal",

            // Ahmedabad (3)
            "Zydus Hospital, Zydus Hospital Road, Near Sola Bridge, Thaltej, Ahmedabad, Gujarat",
            "Apollo Hospitals International, Plot No. 1A, Gandhinagar Highway, Bhat, Ahmedabad, Gujarat",
            "Marengo CIMS Hospital, Off Science City Road, Sola, Ahmedabad, Gujarat",

            // Jaipur (2)
            "Fortis Escorts Hospital, Jawaharlal Nehru Marg, Malviya Nagar, Jaipur, Rajasthan",
            "Manipal Hospital, Sector 5, Main Sikar Road, Vidhyadhar Nagar, Jaipur, Rajasthan",

            // Lucknow (2)
            "Medanta Hospital, Sector 2, Pocket B, Amar Shaheed Path, Golf City, Lucknow, Uttar Pradesh",
            "Apollomedics Super Speciality Hospital, Sector B, Bargawan, LDA Colony, Kanpur Road, Lucknow, Uttar Pradesh",

            // Kochi (2)
            "Aster Medcity, South Chittoor, Cheranalloor, Kochi, Kerala",
            "Amrita Institute of Medical Sciences (AIMS), AIMS Ponekkara P.O., Edappally, Kochi, Kerala",

            // Chandigarh / Mohali (2)
            "Fortis Hospital, Sector 62, Phase VIII, Mohali, Punjab",
            "Post Graduate Institute of Medical Education & Research (PGIMER), Sector 12, Chandigarh",

            // Indore (1)
            "Medanta Super Speciality Hospital, Scheme No 54, PU4, Commercial Complex, Vijay Nagar, Indore, Madhya Pradesh"
    };

    private List<Doctor> createDoctors(String password) {
        String[] specializations = {
                "General Medicine", "Cardiology", "Dermatology", "Pediatrics",
                "Orthopedics", "Neurology", "ENT", "Gynecology",
                "Ophthalmology", "Psychiatry", "Pulmonology", "Gastroenterology",
                "Endocrinology", "Urology"
        };

        String[] firstNames = {
                "Rajesh", "Sunita", "Vikram", "Ananya", "Suresh", "Priya", "Arjun", "Deepa",
                "Rohan", "Meera", "Amit", "Kavita", "Sanjay", "Pooja", "Manoj", "Sneha",
                "Alok", "Divya", "Gaurav", "Nisha", "Ramesh", "Swati", "Abhishek", "Aarti",
                "Ashok", "Neha", "Pradeep", "Shweta", "Vivek", "Tanvi"
        };

        String[] lastNames = {
                "Sharma", "Patel", "Verma", "Iyer", "Nair", "Reddy", "Joshi", "Gupta",
                "Kulkarni", "Deshmukh", "Choudhury", "Bose", "Mehta", "Bhat", "Rao", "Menon",
                "Singh", "Pillai", "Agarwal", "Mukherjee", "Malhotra", "Kapoor", "Mishra", "Pandey",
                "Saxena", "Sen", "Bhattacharya", "Das", "Chatterjee", "Tripathi"
        };

        String[] qualificationsList = {
                "MBBS, MD (General Medicine)", "MBBS, MD (Pediatrics), DNB", "MBBS, MD (Dermatology), DVD",
                "MBBS, MS (Orthopaedics), MCh", "MBBS, DM (Neurology)", "MBBS, MS (ENT), DLO",
                "MBBS, MD (Obstetrics & Gynaecology), FICOG", "MBBS, MS (Ophthalmology)", "MBBS, MD (Psychiatry), DPM",
                "MBBS, MD (Pulmonary Medicine)", "MBBS, DM (Gastroenterology)", "MBBS, DM (Endocrinology)",
                "MBBS, MCh (Urology)", "MBBS, DM (Cardiology), FACC"
        };

        List<Doctor> doctors = new ArrayList<>();
        Random random = new Random(42);

        // Seed 84 doctors (exactly 2 doctors per hospital across all 42 locations)
        for (int i = 1; i <= 84; i++) {
            String firstName = firstNames[(i - 1) % firstNames.length];
            String lastName = lastNames[(i - 1) % lastNames.length];
            String fullName = "Dr. " + firstName + " " + lastName;
            String email = "dr." + firstName.toLowerCase() + "." + lastName.toLowerCase() + i + "@caresync.com";
            String phone = String.format("+91 98200 %05d", 10000 + i);

            User user = User.builder()
                    .email(email)
                    .password(password)
                    .fullName(fullName)
                    .phoneNumber(phone)
                    .role(Role.DOCTOR)
                    .active(true)
                    .build();
            user = userRepository.save(user);

            String spec = specializations[(i - 1) % specializations.length];
            String qual = qualificationsList[(i - 1) % qualificationsList.length];
            String loc = LOCATIONS[(i - 1) % LOCATIONS.length];
            int exp = 4 + random.nextInt(22);
            BigDecimal fee = BigDecimal.valueOf(400 + random.nextInt(12) * 100);

            Doctor doctor = Doctor.builder()
                    .user(user)
                    .specialization(spec)
                    .qualifications(qual)
                    .experienceYears(exp)
                    .bio("Dedicated " + spec + " specialist with " + exp + " years of clinical experience in leading Indian hospitals providing compassionate, evidence-based care.")
                    .location(loc)
                    .consultationFee(fee)
                    .build();

            doctors.add(doctor);
        }
        return doctorRepository.saveAll(doctors);
    }

    private List<Patient> createPatients(String password) {
        String[] firstNames = {
                "Rahul", "Priya", "Amit", "Sneha", "Rohan", "Ananya", "Vikram", "Deepa",
                "Karan", "Pooja", "Arun", "Divya", "Siddharth", "Neha", "Gaurav", "Kavita",
                "Aditya", "Shweta", "Manish", "Sunita", "Naveen", "Swati", "Nikhil", "Aarti",
                "Rajesh", "Meera", "Abhishek", "Ritu", "Alok", "Pallavi", "Sachin", "Jyoti",
                "Prashant", "Bhavna", "Tarun", "Tanvi", "Sandeep", "Vandana", "Varun", "Simran",
                "Deepak", "Ankita", "Hemant", "Radhika", "Mohit", "Preeti", "Sanjay", "Rekha",
                "Vijay", "Anita"
        };

        String[] lastNames = {
                "Sharma", "Patel", "Verma", "Gupta", "Singh", "Kumar", "Iyer", "Nair",
                "Reddy", "Joshi", "Rao", "Deshmukh", "Kulkarni", "Mehta", "Bose", "Menon",
                "Agarwal", "Mukherjee", "Malhotra", "Kapoor", "Mishra", "Pandey", "Choudhury", "Saxena",
                "Sen", "Bhattacharya", "Das", "Chatterjee", "Tripathi", "Dubey", "Yadav", "Trivedi",
                "Shukla", "Pandit", "Rathore", "Chauhan", "Thakur", "Goswami", "Bhatia", "Garg",
                "Puri", "Sethi", "Bansal", "Goel", "Pillai", "Nambiar", "Shetty", "Hegde", "Bhat", "Ghosh"
        };

        String[] bloodGroups = {"A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"};
        String[] genders = {"MALE", "FEMALE", "OTHER"};
        String[] medicalHistories = {
                "No prior chronic medical conditions. No known drug allergies.",
                "History of mild seasonal allergic rhinitis. Penicillin allergy (urticaria).",
                "Diagnosed with Type 2 Diabetes Mellitus (2021). Controlled with Metformin 500mg BD.",
                "Essential Hypertension managed with Telmisartan 40mg once daily.",
                "Mild persistent bronchial asthma. Uses Budecort inhaler PRN.",
                "Prior appendectomy (2018). No active health complaints.",
                "Gastroesophageal reflux disease (GERD). Pantoprazole 40mg taken SOS.",
                "Subclinical hypothyroidism. Managed with Thyronorm 25mcg daily.",
                "Migraine with aura. Avoids triggers. Tab Naproxen SOS.",
                "Borderline dyslipidemia. Managed with dietary modifications and exercise."
        };

        List<Patient> patients = new ArrayList<>();
        Random random = new Random(100);

        List<User> patientUsersBuffer = new ArrayList<>();
        for (int i = 1; i <= 500; i++) {
            String firstName = firstNames[(i - 1) % firstNames.length];
            String lastName = lastNames[(i - 1) % lastNames.length];
            String fullName = firstName + " " + lastName;
            String email = "patient" + i + "@caresync.com";
            String phone = String.format("+91 98%08d", 10000000 + i);

            User user = User.builder()
                    .email(email)
                    .password(password)
                    .fullName(fullName)
                    .phoneNumber(phone)
                    .role(Role.PATIENT)
                    .active(true)
                    .build();
            patientUsersBuffer.add(user);
        }

        List<User> savedUsers = userRepository.saveAll(patientUsersBuffer);

        for (int i = 0; i < savedUsers.size(); i++) {
            User user = savedUsers.get(i);
            int ageYears = 18 + random.nextInt(62);
            LocalDate dob = LocalDate.now().minusYears(ageYears).minusDays(random.nextInt(365));
            String gender = genders[i % genders.length];
            String bloodGroup = bloodGroups[random.nextInt(bloodGroups.length)];
            String emergencyPhone = String.format("+1 (555) %03d-%04d", 400 + (i % 500), 3000 + i);
            String history = medicalHistories[random.nextInt(medicalHistories.length)];

            Patient patient = Patient.builder()
                    .user(user)
                    .dateOfBirth(dob)
                    .gender(gender)
                    .bloodGroup(bloodGroup)
                    .emergencyContact(emergencyPhone)
                    .medicalHistory(history)
                    .build();
            patients.add(patient);
        }

        return patientRepository.saveAll(patients);
    }

    private List<DoctorAvailability> createDoctorAvailabilities(List<Doctor> doctors) {
        List<DoctorAvailability> availabilities = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Doctor doctor : doctors) {
            int slotDuration = (doctor.getId() % 3 == 0) ? 15 : (doctor.getId() % 3 == 1) ? 30 : 45;

            for (int dayOffset = -15; dayOffset <= 14; dayOffset++) {
                LocalDate date = today.plusDays(dayOffset);
                DayOfWeek dayOfWeek = date.getDayOfWeek();

                if (dayOfWeek == DayOfWeek.SUNDAY) {
                    continue;
                }

                DoctorAvailability morningBlock = DoctorAvailability.builder()
                        .doctor(doctor)
                        .availableDate(date)
                        .dayOfWeek(dayOfWeek)
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(13, 0))
                        .slotDurationMinutes(slotDuration)
                        .active(true)
                        .build();
                availabilities.add(morningBlock);

                DoctorAvailability afternoonBlock = DoctorAvailability.builder()
                        .doctor(doctor)
                        .availableDate(date)
                        .dayOfWeek(dayOfWeek)
                        .startTime(LocalTime.of(14, 0))
                        .endTime(LocalTime.of(17, 0))
                        .slotDurationMinutes(slotDuration)
                        .active(true)
                        .build();
                availabilities.add(afternoonBlock);
            }
        }
        return availabilities;
    }

    private List<Appointment> createAppointments(List<Doctor> doctors,
                                                  List<Patient> patients,
                                                  List<DoctorAvailability> availabilities) {
        List<Appointment> appointments = new ArrayList<>();
        Set<String> bookedSlots = new HashSet<>();
        Random random = new Random(2026);
        LocalDate today = LocalDate.now();

        String[] reasons = {
                "Routine annual health checkup and blood work.",
                "Consultation for chronic lower back pain.",
                "Follow-up evaluation for blood pressure management.",
                "Persistent cough and seasonal flu symptoms.",
                "Skin rash and allergic reaction consultation.",
                "Childhood vaccination and wellness screening.",
                "Migraine headache evaluation and management.",
                "Chest tightness and cardiology screening.",
                "Joint stiffness and orthopedic consultation.",
                "Routine prescription renewal and general checkup."
        };

        String[] doctorNotes = {
                "Patient presented with mild symptoms. Vitals stable.",
                "Patient reports good response to current medication.",
                "Recommended lifestyle modifications and follow-up in 4 weeks.",
                "Prescribed course of antibiotics and advised bed rest.",
                "Routine follow-up completed. All lab tests within normal parameters."
        };

        Map<Long, List<DoctorAvailability>> doctorAvailMap = new HashMap<>();
        for (DoctorAvailability avail : availabilities) {
            doctorAvailMap.computeIfAbsent(avail.getDoctor().getId(), k -> new ArrayList<>()).add(avail);
        }

        int targetAppointments = 1800;
        int appointmentCount = 0;

        for (Doctor doctor : doctors) {
            List<DoctorAvailability> doctorAvails = doctorAvailMap.getOrDefault(doctor.getId(), Collections.emptyList());

            for (DoctorAvailability avail : doctorAvails) {
                LocalTime current = avail.getStartTime();
                LocalTime end = avail.getEndTime();
                int step = avail.getSlotDurationMinutes();

                while (current.plusMinutes(step).isBefore(end) || current.plusMinutes(step).equals(end)) {
                    LocalTime slotStart = current;
                    LocalTime slotEnd = current.plusMinutes(step);
                    current = slotEnd;

                    String slotKey = doctor.getId() + "_" + avail.getAvailableDate() + "_" + slotStart;
                    if (bookedSlots.contains(slotKey)) {
                        continue;
                    }

                    if (random.nextDouble() > 0.35) {
                        continue;
                    }

                    bookedSlots.add(slotKey);
                    Patient randomPatient = patients.get(random.nextInt(patients.size()));
                    LocalDate appDate = avail.getAvailableDate();

                    AppointmentStatus status;
                    if (appDate.isBefore(today)) {
                        double roll = random.nextDouble();
                        if (roll < 0.70) {
                            status = AppointmentStatus.COMPLETED;
                        } else if (roll < 0.85) {
                            status = AppointmentStatus.CANCELLED;
                        } else {
                            status = AppointmentStatus.NO_SHOW;
                        }
                    } else {
                        double roll = random.nextDouble();
                        if (roll < 0.60) {
                            status = AppointmentStatus.CONFIRMED;
                        } else if (roll < 0.85) {
                            status = AppointmentStatus.SCHEDULED;
                        } else {
                            status = AppointmentStatus.CANCELLED;
                        }
                    }

                    String reason = reasons[random.nextInt(reasons.length)];
                    String note = (status == AppointmentStatus.COMPLETED) ? doctorNotes[random.nextInt(doctorNotes.length)] : null;
                    boolean reminderSent = (status == AppointmentStatus.COMPLETED || status == AppointmentStatus.CONFIRMED || appDate.isBefore(today));

                    Appointment app = Appointment.builder()
                            .patient(randomPatient)
                            .doctor(doctor)
                            .appointmentDate(appDate)
                            .startTime(slotStart)
                            .endTime(slotEnd)
                            .status(status)
                            .reason(reason)
                            .notes(note)
                            .reminderSent(reminderSent)
                            .build();

                    appointments.add(app);
                    appointmentCount++;

                    if (appointmentCount >= targetAppointments) {
                        break;
                    }
                }
                if (appointmentCount >= targetAppointments) {
                    break;
                }
            }
            if (appointmentCount >= targetAppointments) {
                break;
            }
        }

        return appointments;
    }

    private List<Prescription> createPrescriptions(List<Appointment> appointments) {
        List<Prescription> prescriptions = new ArrayList<>();
        Random random = new Random(3030);

        String[] diagnoses = {
                "Essential (Primary) Hypertension",
                "Type 2 Diabetes Mellitus without complications",
                "Acute Upper Respiratory Tract Infection",
                "Allergic Rhinitis due to pollen",
                "Gastroesophageal Reflux Disease without esophagitis",
                "Tension-type Headache",
                "Atopic Dermatitis / Eczema",
                "Acute Bacterial Sinusitis",
                "Mild Asthma Exacerbation",
                "Hyperlipidemia / Elevated Cholesterol"
        };

        String[] medicinesList = {
                "Lisinopril 10mg Tablets",
                "Metformin Hydrochloride 500mg Extended Release",
                "Amoxicillin 500mg Capsules",
                "Cetirizine HCl 10mg Tablets",
                "Omeprazole 20mg Delayed-Release Capsules",
                "Ibuprofen 400mg Film-Coated Tablets",
                "Atorvastatin Calcium 20mg Tablets",
                "Albuterol Sulfate Inhalation Aerosol 90mcg",
                "Hydrochlorothiazide 12.5mg Tablets",
                "Azithromycin 250mg Film-Coated Tablets"
        };

        String[] dosages = {"1 tablet", "2 capsules", "1 puff", "5 ml", "1 tablet daily"};
        String[] frequencies = {"Once daily in the morning", "Twice daily after meals", "Three times daily as needed", "Every 12 hours"};
        String[] durations = {"7 days", "10 days", "14 days", "30 days", "90 days"};
        String[] instructionsList = {
                "Take with full glass of water. Do not crush or chew tablets.",
                "Take with meals to minimize gastrointestinal discomfort.",
                "Complete full course of antibiotics even if symptoms improve.",
                "Use inhaler as needed for shortness of breath.",
                "Store at room temperature away from moisture and direct heat."
        };

        for (Appointment app : appointments) {
            if (app.getStatus() == AppointmentStatus.COMPLETED && random.nextDouble() < 0.85) {
                String dx = diagnoses[random.nextInt(diagnoses.length)];
                String med = medicinesList[random.nextInt(medicinesList.length)];
                String dosage = dosages[random.nextInt(dosages.length)];
                String freq = frequencies[random.nextInt(frequencies.length)];
                String dur = durations[random.nextInt(durations.length)];
                String inst = instructionsList[random.nextInt(instructionsList.length)];

                Prescription rx = Prescription.builder()
                        .patient(app.getPatient())
                        .doctor(app.getDoctor())
                        .appointment(app)
                        .diagnosis(dx)
                        .medicines(med)
                        .dosage(dosage)
                        .frequency(freq)
                        .duration(dur)
                        .instructions(inst)
                        .doctorNotes("Rx issued following clinical examination. Follow up in " + dur + ".")
                        .build();

                prescriptions.add(rx);
            }
        }
        return prescriptions;
    }
}
