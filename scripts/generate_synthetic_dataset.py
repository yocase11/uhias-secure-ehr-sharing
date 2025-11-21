#!/usr/bin/env python3
"""Generate a synthetic health blockchain dataset (CSV).
Writes to datasets/synthetic_health_blockchain_dataset.csv
"""
import csv
import random
from datetime import datetime, timedelta

OUT_PATH = "datasets/synthetic_health_blockchain_dataset.csv"
NUM = 5000

first_names = ["John","Jane","Alex","Emily","Michael","Sarah","David","Laura","Chris","Anna","Robert","Olivia","James","Linda","Daniel","Sophia","Matthew","Emma","Andrew","Grace"]
last_names = ["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Garcia","Rodriguez","Wilson","Martinez","Anderson","Taylor","Thomas","Hernandez","Moore","Martin","Jackson","Thompson","White"]
countries = ["USA","UK","Canada","Australia","India","Germany","France","Spain","Italy","Netherlands"]
diagnoses = ["Diabetes","Hypertension","Asthma","COPD","Fracture","Cancer","Flu","Pneumonia","Hyponatremia","Migraine"]
report_types = ["Lab","Imaging","Report","Prescription","Procedure"]
doctor_opinions = ["Stable","Improved","Critical","Needs follow-up"]
hospitals = ["General Hospital","City Clinic","St Mary's","County Medical Center","Central Hospital","Northside Clinic"]

random.seed(42)

with open(OUT_PATH, "w", newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    header = ["PatientID","Name","Age","Gender","Country","Diagnosis","ReportType","DoctorOpinion","Hospital","RecordID","FileCID","FileHash","Uploader","ConsentGiven","AccessRequests","Latency(ms)","TxCost(ETH)"]
    writer.writerow(header)

    base_date = datetime(2025, 1, 1, 8, 0, 0)
    for i in range(1, NUM+1):
        patient_id = i
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        age = random.randint(0, 95)
        gender = random.choices(["M","F","O"], weights=[45,45,10])[0]
        country = random.choice(countries)
        diagnosis = random.choice(diagnoses)
        report_type = random.choice(report_types)
        doctor_opinion = random.choice(doctor_opinions)
        hospital = random.choice(hospitals)
        record_id = f"rec{str(i).zfill(5)}"
        file_cid = f"cid{str(i).zfill(5)}"
        file_hash = f"hash{str(i).zfill(8)}"
        uploader = '0x' + ''.join(random.choice('0123456789abcdef') for _ in range(40))
        consent_given = random.choices(["true","false"], weights=[90,10])[0]
        access_requests = random.randint(0, 20)
        latency = random.randint(50, 400)
        tx_cost = round(random.uniform(0.0005, 0.005), 6)

        writer.writerow([patient_id, name, age, gender, country, diagnosis, report_type, doctor_opinion, hospital, record_id, file_cid, file_hash, uploader, consent_given, access_requests, latency, tx_cost])

print(f"Wrote {NUM} records to {OUT_PATH}")
