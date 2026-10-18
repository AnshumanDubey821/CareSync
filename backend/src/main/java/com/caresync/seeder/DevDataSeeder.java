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

        if (userCount >= 500 && patientCount >= 400 && doctorCount >= 40) {
            log.info("Development dataset already exists (Users: {}, Doctors: {}, Patients: {}). Skipping seeding.",
                    userCount, doctorCount, patientCount);
            return;
        }

        log.info("Starting CareSync Development Data Seeding...");
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
                    .phoneNumber("+1 (555) 010-000" + i)
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            admins.add(admin);
        }
        return admins;
    }

    private List<Doctor> createDoctors(String password) {
        String[] specializations = {
                "General Medicine", "Cardiology", "Dermatology", "Pediatrics",
                "Orthopedics", "Neurology", "ENT", "Gynecology",
                "Ophthalmology", "Psychiatry", "Pulmonology", "Gastroenterology",
                "Endocrinology", "Urology"
        };

        String[] firstNames = {
                "Sarah", "Robert", "Emily", "David", "Michael", "Jennifer", "James", "Jessica",
                "William", "Elizabeth", "Richard", "Linda", "Joseph", "Barbara", "Thomas", "Susan",
                "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret",
                "Anthony", "Betty", "Mark", "Sandra", "Donald", "Ashley"
        };

        String[] lastNames = {
                "Jenkins", "Chen", "Taylor", "Patel", "Williams", "Miller", "Davis", "Rodriguez",
                "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Moore",
                "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
                "Ramirez", "Lewis", "Robinson", "Walker", "Young"
        };

        String[] qualificationsList = {
                "MD, FACC", "MBBS, MD (Pediatrics)", "MD (Dermatology), Board Certified",
                "MS (Orthopedics), FRCS", "MD (Neurology), PhD", "MBBS, MS (ENT)",
                "MD (Obstetrics & Gynecology)", "MD, DO (Ophthalmology)", "MD (Psychiatry), ABPN",
                "MD (Pulmonary Medicine)", "MD (Gastroenterology)", "MD (Endocrinology)",
                "MBBS, MCh (Urology)", "MD (Internal Medicine)"
        };

        String[] locations = {
                "Metropolitan Health Tower, Suite 301, New York, NY",
                "Westside Medical Pavilion, Suite 105, Chicago, IL",
                "Central Clinic & Wellness Center, Austin, TX",
                "St. Jude Specialist Center, Suite 412, San Francisco, CA",
                "Valley Healthcare Plaza, Suite 204, Seattle, WA",
                "Oakridge Medical Complex, Suite 510, Boston, MA",
                "Sunrise General Hospital, Suite 102, Miami, FL",
                "Downtown Medical Suites, Suite 308, Denver, CO"
        };

        List<Doctor> doctors = new ArrayList<>();
        Random random = new Random(42);

        for (int i = 1; i <= 50; i++) {
            String firstName = firstNames[(i - 1) % firstNames.length];
            String lastName = lastNames[(i - 1) % lastNames.length];
            String fullName = "Dr. " + firstName + " " + lastName;
            String email = "dr." + firstName.toLowerCase() + "." + lastName.toLowerCase() + i + "@caresync.com";
            String phone = String.format("+1 (555) %03d-%04d", 200 + i, 1000 + i);

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
            String loc = locations[(i - 1) % locations.length];
            int exp = 4 + random.nextInt(22);
            BigDecimal fee = BigDecimal.valueOf(75 + random.nextInt(18) * 10);

            Doctor doctor = Doctor.builder()
                    .user(user)
                    .specialization(spec)
                    .qualifications(qual)
                    .experienceYears(exp)
                    .bio("Dedicated " + spec + " specialist with " + exp + " years of clinical experience providing compassionate, evidence-based care.")
                    .location(loc)
                    .consultationFee(fee)
                    .build();

            doctors.add(doctor);
        }
        return doctorRepository.saveAll(doctors);
    }

    private List<Patient> createPatients(String password) {
        String[] firstNames = {
                "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
                "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
                "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
                "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
                "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
                "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Melissa", "George", "Deborah",
                "Edward", "Stephanie"
        };

        String[] lastNames = {
                "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
                "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
                "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
                "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
                "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
        };

        String[] bloodGroups = {"A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"};
        String[] genders = {"MALE", "FEMALE", "OTHER"};
        String[] medicalHistories = {
                "No prior chronic medical conditions. No known drug allergies.",
                "History of mild seasonal allergic rhinitis. Penicillin allergy (hives).",
                "Diagnosed with Type 2 Diabetes (2021). Controlled with diet and metformin.",
                "Essential Hypertension managed with Lisinopril 10mg daily.",
                "Mild persistent asthma. Uses Albuterol inhaler PRN.",
                "Prior appendectomy (2018). No active health complaints.",
                "Gastroesophageal reflux disease (GERD). Sulfa drug allergy."
        };

        List<Patient> patients = new ArrayList<>();
        Random random = new Random(100);

        List<User> patientUsersBuffer = new ArrayList<>();
        for (int i = 1; i <= 500; i++) {
            String firstName = firstNames[(i - 1) % firstNames.length];
            String lastName = lastNames[(i - 1) % lastNames.length];
            String fullName = firstName + " " + lastName;
            String email = "patient" + i + "@caresync.com";
            String phone = String.format("+1 (555) %03d-%04d", 300 + (i % 700), 2000 + i);

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
