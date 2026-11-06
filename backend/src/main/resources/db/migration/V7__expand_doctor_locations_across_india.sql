-- Flyway Migration V7: Expand Doctor Hospital Locations Across India to 42 Prestigious Healthcare Facilities

DO $$
DECLARE
    hospitals TEXT[] := ARRAY[
        'Apollo Hospitals, 154/11 Bannerghatta Road, Indiranagar, Bengaluru, Karnataka',
        'Manipal Hospital, 98 HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka',
        'Narayana Institute of Cardiac Sciences, Bommasandra Industrial Area, Bengaluru, Karnataka',
        'Fortis Hospital, 154/9 Bannerghatta Road, Opposite IIMB, Bengaluru, Karnataka',
        'Aster CMI Hospital, No. 43/42 NH 44, Sahakar Nagar, Hebbal, Bengaluru, Karnataka',
        'Max Super Speciality Hospital, 1 Press Enclave Road, Saket, New Delhi',
        'Sir Ganga Ram Hospital, Sir Ganga Ram Hospital Marg, Rajinder Nagar, New Delhi',
        'All India Institute of Medical Sciences (AIIMS), Sri Aurobindo Marg, Ansari Nagar, New Delhi',
        'Indraprastha Apollo Hospitals, Delhi-Mathura Road, Sarita Vihar, New Delhi',
        'BLK-Max Super Speciality Hospital, Pusa Road, Karol Bagh, New Delhi',
        'Fortis Memorial Research Institute, Sector 44, Gurugram, Haryana',
        'Medanta - The Medicity, CH Bakhtawar Singh Road, Sector 38, Gurugram, Haryana',
        'Kokilaben Dhirubhai Ambani Hospital, Rao Saheb Patwardhan Marg, Andheri West, Mumbai, Maharashtra',
        'Lilavati Hospital and Research Centre, A-791 Bandra Reclamation, Bandra West, Mumbai, Maharashtra',
        'Tata Memorial Hospital, Dr. E Borges Road, Parel, Mumbai, Maharashtra',
        'Sir H.N. Reliance Foundation Hospital, Raja Ram Mohan Roy Road, Prarthana Samaj, Girgaon, Mumbai, Maharashtra',
        'Apollo Health City, Road No 72, Film Nagar, Jubilee Hills, Hyderabad, Telangana',
        'Yashoda Hospitals, Raj Bhavan Road, Matha Nagar, Somajiguda, Hyderabad, Telangana',
        'KIMS Hospitals, 1-8-31/1 Minister Road, Krishna Nagar Colony, Secunderabad, Hyderabad, Telangana',
        'Care Hospitals, Road No 1, Prem Nagar, Banjara Hills, Hyderabad, Telangana',
        'Apollo Speciality Hospitals, 320 Mount Road, Teynampet, Chennai, Tamil Nadu',
        'Gleneagles Global Health City, 439 Cheran Nagar, Perumbakkam, Chennai, Tamil Nadu',
        'Fortis Malar Hospital, No. 52 1st Main Road, Gandhi Nagar, Adyar, Chennai, Tamil Nadu',
        'MIOT International Hospital, 4/112 Mount Poonamallee High Road, Manapakkam, Chennai, Tamil Nadu',
        'Ruby Hall Clinic, 40 Sassoon Road, Sangamvadi, Pune, Maharashtra',
        'Jehangir Hospital, 32 Sasoon Road, Opposite Railway Station, Pune, Maharashtra',
        'Sahyadri Super Speciality Hospital, Plot No. 30 C, Erandwane, Deccan Gymkhana, Pune, Maharashtra',
        'Manipal Hospital, Broadway, IB Block, Sector III, Salt Lake, Kolkata, West Bengal',
        'Apollo Multispeciality Hospitals, 58 Canal Circular Road, Kadapara, Kolkata, West Bengal',
        'Fortis Hospital Anandapur, 730 Anandapur, E.M. Bypass Road, Kolkata, West Bengal',
        'Zydus Hospital, Zydus Hospital Road, Near Sola Bridge, Thaltej, Ahmedabad, Gujarat',
        'Apollo Hospitals International, Plot No. 1A, Gandhinagar Highway, Bhat, Ahmedabad, Gujarat',
        'Marengo CIMS Hospital, Off Science City Road, Sola, Ahmedabad, Gujarat',
        'Fortis Escorts Hospital, Jawaharlal Nehru Marg, Malviya Nagar, Jaipur, Rajasthan',
        'Manipal Hospital, Sector 5, Main Sikar Road, Vidhyadhar Nagar, Jaipur, Rajasthan',
        'Medanta Hospital, Sector 2, Pocket B, Amar Shaheed Path, Golf City, Lucknow, Uttar Pradesh',
        'Apollomedics Super Speciality Hospital, Sector B, Bargawan, LDA Colony, Kanpur Road, Lucknow, Uttar Pradesh',
        'Aster Medcity, South Chittoor, Cheranalloor, Kochi, Kerala',
        'Amrita Institute of Medical Sciences (AIMS), AIMS Ponekkara P.O., Edappally, Kochi, Kerala',
        'Fortis Hospital, Sector 62, Phase VIII, Mohali, Punjab',
        'Post Graduate Institute of Medical Education & Research (PGIMER), Sector 12, Chandigarh',
        'Medanta Super Speciality Hospital, Scheme No 54, PU4, Commercial Complex, Vijay Nagar, Indore, Madhya Pradesh'
    ];
    r RECORD;
    idx INT := 1;
BEGIN
    FOR r IN SELECT id FROM doctors ORDER BY id LOOP
        UPDATE doctors
        SET location = hospitals[((idx - 1) % array_length(hospitals, 1)) + 1],
            updated_at = NOW()
        WHERE id = r.id;
        idx := idx + 1;
    END LOOP;
END $$;
