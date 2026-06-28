import os
import sys
import pickle
import traceback
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
# Enable CORS for all routes, allowing frontend to call from different ports or local file URLs
CORS(app)

# Directory containing model and scaler pickle files
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')

# Lists to track model status
models_loaded = []
models_fallback = []

# Dictionaries to store loaded models and scalers
models = {}
scalers = {}

DISEASES = [
    'diabetes',
    'hypertension',
    'heart',
    'cancer',   
    'thyroid',
    'ckd',
    'obesity'
]

# Dataset mean values for clinical measurements used to impute missing/null values
DATASET_MEANS = {
    'cholesterol': 190.0,      # mg/dL
    'hba1c': 5.5,              # percentage
    'ecg': 0.0,                # 0: Normal, 1: Mild, 2: Clear Abnormality
    'max_heart_rate': 145.0,   # bpm
    'haemoglobin': 13.5,       # g/dL
    'creatinine': 0.9,         # mg/dL
    'tsh': 2.1,                # uIU/mL
    'waist': 85.0              # cm
}

# --- MODEL FEATURE ORDER MAPPINGS (CRITICAL COMMENTS) ---

# Diabetes model expects features in this exact order:
# [Pregnancies, Glucose, BloodPressure, BMI, DiabetesPedigreeFunction, Age]
# Mapping:
# - Pregnancies: 0 (default/not collected)
# - Glucose: blood_sugar
# - BloodPressure: diastolic_bp
# - BMI: bmi
# - DiabetesPedigreeFunction: diabetes_severity / 100 * 0.5 + 0.1
# - Age: age

# Hypertension model expects features in this exact order:
# [Age, Smoking_Status, BP_History, Exercise_Level, Sleep_Duration, BMI, Family_History, Salt_Intake, Stress_Score]
# Mapping:
# - Age: age
# - Smoking_Status: smoking (1 or 0)
# - BP_History: hypertension_fh (1 or 0)
# - Exercise_Level: physical_activity (0: Sedentary, 1: Moderate, 2: Active)
# - Sleep_Duration: 7 (default)
# - BMI: bmi
# - Family_History: hypertension_severity / 100
# - Salt_Intake: 1 (default/average)
# - Stress_Score: 5 (default/average)

# Heart model expects features in this exact order:
# [age, sex, cp, trestbps, chol, fbs, restecg, thalach]
# Mapping:
# - age: age
# - sex: gender (1: Male, 0: Female)
# - cp: 1 if symptom_chest_pain == 1 else 0
# - trestbps: systolic_bp
# - chol: cholesterol (or mean if null)
# - fbs: 1 if blood_sugar > 120 else 0
# - restecg: ecg (0: Normal, 1: Mild Abnormality, 2: Clear Abnormality)
# - thalach: max_heart_rate (or mean if null)

# Cancer model expects features in this exact order:
# [Age, Gender, Smoking, Alcohol, FamilyHistory, SeverityScore, PhysicalActivity]
# Mapping:
# - Age: age
# - Gender: gender (1: Male, 0: Female)
# - Smoking: smoking (1 or 0)
# - Alcohol: alcohol (1 or 0)
# - FamilyHistory: cancer_fh (1 or 0)
# - SeverityScore: cancer_severity / 100
# - PhysicalActivity: physical_activity (0: Sedentary, 1: Moderate, 2: Active)

# Thyroid model expects features in this exact order:
# [Age, Gender, TSH, FamilyHistory, SeverityScore, FatigueSymptom]
# Mapping:
# - Age: age
# - Gender: gender (1: Male, 0: Female)
# - TSH: TSH (or mean if null)
# - FamilyHistory: thyroid_fh (1 or 0)
# - SeverityScore: thyroid_severity / 100
# - FatigueSymptom: symptom_fatigue (1 or 0)

# Chronic Kidney Disease (CKD) model expects features in this exact order:
# [Age, SystolicBP, DiastolicBP, FastingSugar, Creatinine, Haemoglobin, FamilyHistory, SeverityScore]
# Mapping:
# - Age: age
# - SystolicBP: systolic_bp
# - DiastolicBP: diastolic_bp
# - FastingSugar: blood_sugar
# - Creatinine: creatinine (or mean if null)
# - Haemoglobin: haemoglobin (or mean if null)
# - FamilyHistory: ckd_fh (1 or 0)
# - SeverityScore: ckd_severity / 100

# Obesity model expects features in this exact order:
# [Age, Gender, BMI, WaistCircumference, PhysicalActivity, DietType, FamilyHistory, SeverityScore]
# Mapping:
# - Age: age
# - Gender: gender (1: Male, 0: Female)
# - BMI: bmi
# - WaistCircumference: waist (or mean if null)
# - PhysicalActivity: physical_activity (0: Sedentary, 1: Moderate, 2: Active)
# - DietType: diet (0: Veg, 1: Non-Veg/Mixed)
# - FamilyHistory: obesity_fh (1 or 0)
# - SeverityScore: obesity_severity / 100

# Try loading pickle models and scalers on startup
print("Initializing Family Health Risk Predictor Models...", file=sys.stderr)
FILE_NAME_MAP = {
    "diabetes": "diabetes",
    "hypertension": "hypertension",
    "heart": "heart",
    "cancer": "cancer",
    "thyroid": "thyroid",
    "ckd": "kidney",
    "obesity": "obesity"
}

for disease in DISEASES:
    filename = FILE_NAME_MAP[disease]

    model_path = os.path.join(MODELS_DIR, f"{filename}_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, f"{filename}_scaler.pkl")

    if os.path.exists(model_path):
        try:
            models[disease] = joblib.load(model_path)
            print(f"Loaded model for {disease}")
            models_loaded.append(disease)
        except Exception as e:
            print(f"Error loading model for {disease}: {e}")
    else:
        print(f"Warning: Model file not found for {disease}: {model_path}")

    if os.path.exists(scaler_path):
        try:
            scalers[disease] = joblib.load(scaler_path)
            print(f"Loaded scaler for {disease}")
        except Exception as e:
            print(f"Error loading scaler for {disease}: {e}")
    else:
        print(f"Warning: Scaler file not found for {disease}: {scaler_path}")

print(f"Initialization complete. Models Loaded: {list(models.keys())}", file=sys.stderr)
print(f"Models Fallback: {models_fallback}", file=sys.stderr)


def python_fallback_predict(disease, data):
    """
    Python-based rule-based fallback risk calculator matching the frontend logic.
    Calculates probability out of 100.
    """
    age = data.get('age', 30)
    gender = data.get('gender', 1)
    smoking = data.get('smoking', 0)
    alcohol = data.get('alcohol', 0)
    physical_activity = data.get('physical_activity', 1)  # 0: Sedentary, 1: Mod, 2: Active
    diet = data.get('diet', 1)  # 0: Veg, 1: Non-Veg/Mixed
    
    systolic_bp = data.get('systolic_bp', 120)
    diastolic_bp = data.get('diastolic_bp', 80)
    blood_sugar = data.get('blood_sugar', 95)
    bmi = data.get('bmi', 22.0)
    
    # Impute missing clinical values with defaults
    cholesterol = data.get('cholesterol')
    if cholesterol is None: cholesterol = DATASET_MEANS['cholesterol']
    
    hba1c = data.get('hba1c')
    if hba1c is None: hba1c = DATASET_MEANS['hba1c']
    
    ecg = data.get('ecg')
    if ecg is None: ecg = DATASET_MEANS['ecg']
    
    max_heart_rate = data.get('max_heart_rate')
    if max_heart_rate is None: max_heart_rate = DATASET_MEANS['max_heart_rate']
    
    haemoglobin = data.get('haemoglobin')
    if haemoglobin is None: haemoglobin = DATASET_MEANS['haemoglobin']
    
    creatinine = data.get('creatinine')
    if creatinine is None: creatinine = DATASET_MEANS['creatinine']
    
    tsh = data.get('tsh')
    if tsh is None: tsh = DATASET_MEANS['tsh']
    
    waist = data.get('waist')
    if waist is None: waist = DATASET_MEANS['waist']
    
    # Symptoms
    s_thirst = data.get('symptom_thirst', 0)
    s_fatigue = data.get('symptom_fatigue', 0)
    s_chest_pain = data.get('symptom_chest_pain', 0)
    s_breathless = data.get('symptom_breathless', 0)
    s_blurred_vision = data.get('symptom_blurred_vision', 0)
    s_headache = data.get('symptom_headache', 0)
    s_swelling = data.get('symptom_swelling', 0)
    s_weight_change = data.get('symptom_weight_change', 0)
    s_joint_pain = data.get('symptom_joint_pain', 0)
    s_infections = data.get('symptom_infections', 0)
    s_pale_skin = data.get('symptom_pale_skin', 0)
    s_breathless_rest = data.get('symptom_breathless_rest', 0)
    
    # Family histories
    fh_diabetes = data.get('diabetes_fh', 0)
    sev_diabetes = data.get('diabetes_severity', 0)
    
    fh_hypertension = data.get('hypertension_fh', 0)
    sev_hypertension = data.get('hypertension_severity', 0)
    
    fh_heart = data.get('heart_fh', 0)
    sev_heart = data.get('heart_severity', 0)
    
    fh_cancer = data.get('cancer_fh', 0)
    sev_cancer = data.get('cancer_severity', 0)
    
    fh_thyroid = data.get('thyroid_fh', 0)
    sev_thyroid = data.get('thyroid_severity', 0)
    
    fh_ckd = data.get('ckd_fh', 0)
    sev_ckd = data.get('ckd_severity', 0)
    
    fh_obesity = data.get('obesity_fh', 0)
    sev_obesity = data.get('obesity_severity', 0)
    
    # Base risk depending on age
    base_risk = 5.0 + (age - 18) * 0.3 if age > 18 else 5.0
    
    score = base_risk
    
    if disease == 'diabetes':
        # Family History
        if fh_diabetes:
            score += sev_diabetes * 0.40
        # Vitals
        if blood_sugar > 100: score += (blood_sugar - 100) * 0.5
        if bmi > 25: score += (bmi - 25) * 1.5
        # Symptoms
        if s_thirst: score += 15
        if s_fatigue: score += 5
        if s_blurred_vision: score += 10
        if s_weight_change: score += 10
        if s_infections: score += 8
        # Clinical
        if hba1c > 5.7: score += (hba1c - 5.7) * 20
        # Lifestyle
        if physical_activity == 0: score += 8
        if physical_activity == 2: score -= 5
        
    elif disease == 'hypertension':
        # Family History
        if fh_hypertension:
            score += sev_hypertension * 0.40
        # Vitals
        if systolic_bp > 120: score += (systolic_bp - 120) * 0.6
        if diastolic_bp > 80: score += (diastolic_bp - 80) * 0.8
        if bmi > 25: score += (bmi - 25) * 1.2
        # Symptoms
        if s_headache: score += 12
        if s_fatigue: score += 5
        if s_swelling: score += 8
        # Lifestyle
        if smoking: score += 10
        if alcohol: score += 8
        if physical_activity == 0: score += 8
        
    elif disease == 'heart':
        # Family History
        if fh_heart:
            score += sev_heart * 0.40
        # Vitals/Clinical
        if systolic_bp > 130 or diastolic_bp > 85: score += 12
        if cholesterol > 200: score += (cholesterol - 200) * 0.25
        if bmi > 25: score += (bmi - 25) * 1.0
        # Symptoms
        if s_chest_pain: score += 30
        if s_breathless or s_breathless_rest: score += 15
        if s_fatigue: score += 5
        # Clinical ECG / Max HR
        if ecg == 1: score += 10
        elif ecg == 2: score += 25
        if max_heart_rate > 160: score += 8
        # Lifestyle
        if smoking: score += 12
        if alcohol: score += 8
        if physical_activity == 0: score += 8
        
    elif disease == 'cancer':
        # Family History
        if fh_cancer:
            score += sev_cancer * 0.45
        # Lifestyle
        if smoking: score += 20
        if alcohol: score += 10
        if physical_activity == 0: score += 5
        # Symptoms
        if s_weight_change: score += 12
        if s_fatigue: score += 8
        if s_pale_skin: score += 8
        
    elif disease == 'thyroid':
        # Family History
        if fh_thyroid:
            score += sev_thyroid * 0.40
        # Symptoms
        if s_fatigue: score += 15
        if s_weight_change: score += 15
        if s_joint_pain: score += 8
        # Clinical
        tsh_diff = abs(tsh - 2.2)
        if tsh_diff > 1.8: score += tsh_diff * 12
        
    elif disease == 'ckd':
        # Family History
        if fh_ckd:
            score += sev_ckd * 0.40
        # Vitals/Clinical
        if creatinine > 1.1: score += (creatinine - 1.1) * 45
        if systolic_bp > 130 or diastolic_bp > 85: score += 10
        if blood_sugar > 120: score += 8
        if haemoglobin < 12.0: score += (12.0 - haemoglobin) * 8
        # Symptoms
        if s_swelling: score += 15
        if s_fatigue: score += 8
        if s_breathless: score += 8
        
    elif disease == 'obesity':
        # Family History
        if fh_obesity:
            score += sev_obesity * 0.40
        # Vitals/Measurements
        if bmi > 25: score += (bmi - 25) * 6
        if waist > 80 if gender == 0 else waist > 90: score += 15
        # Lifestyle
        if physical_activity == 0: score += 10
        if physical_activity == 2: score -= 5
        if diet == 1: score += 5
        # Symptoms
        if s_joint_pain: score += 5

    # Constrain score between 0% and 100%
    return float(np.clip(score, 0, 100))


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": list(models.keys()),
        "models_fallback": models_fallback
    })


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        # Parse basic variables
        age = float(data.get('age', 30))
        gender = int(data.get('gender', 1))  # 1: Male, 0: Female
        smoking = int(data.get('smoking', 0))
        alcohol = int(data.get('alcohol', 0))
        physical_activity = int(data.get('physical_activity', 1))  # 0: Sedentary, 1: Moderate, 2: Active
        diet = int(data.get('diet', 1))  # 0: Veg, 1: Non-Veg/Mixed
        systolic_bp = float(data.get('systolic_bp', 120))
        diastolic_bp = float(data.get('diastolic_bp', 80))
        blood_sugar = float(data.get('blood_sugar', 95))
        bmi = float(data.get('bmi', 22.0))
        
        # Handle clinical variables and impute with dataset means if null
        cholesterol = data.get('cholesterol')
        cholesterol = float(cholesterol) if cholesterol is not None else DATASET_MEANS['cholesterol']
        
        hba1c = data.get('hba1c')
        hba1c = float(hba1c) if hba1c is not None else DATASET_MEANS['hba1c']
        
        ecg = data.get('ecg')
        ecg = int(ecg) if ecg is not None else int(DATASET_MEANS['ecg'])
        
        max_heart_rate = data.get('max_heart_rate')
        max_heart_rate = float(max_heart_rate) if max_heart_rate is not None else DATASET_MEANS['max_heart_rate']
        
        haemoglobin = data.get('haemoglobin')
        haemoglobin = float(haemoglobin) if haemoglobin is not None else DATASET_MEANS['haemoglobin']
        
        creatinine = data.get('creatinine')
        creatinine = float(creatinine) if creatinine is not None else DATASET_MEANS['creatinine']
        
        tsh = data.get('tsh')
        tsh = float(tsh) if tsh is not None else DATASET_MEANS['tsh']
        
        waist = data.get('waist')
        waist = float(waist) if waist is not None else DATASET_MEANS['waist']

        # Symptoms
        s_thirst = int(data.get('symptom_thirst', 0))
        s_fatigue = int(data.get('symptom_fatigue', 0))
        s_chest_pain = int(data.get('symptom_chest_pain', 0))
        s_breathless = int(data.get('symptom_breathless', 0))
        s_blurred_vision = int(data.get('symptom_blurred_vision', 0))
        s_headache = int(data.get('symptom_headache', 0))
        s_swelling = int(data.get('symptom_swelling', 0))
        s_weight_change = int(data.get('symptom_weight_change', 0))
        s_joint_pain = int(data.get('symptom_joint_pain', 0))
        s_infections = int(data.get('symptom_infections', 0))
        s_pale_skin = int(data.get('symptom_pale_skin', 0))
        s_breathless_rest = int(data.get('symptom_breathless_rest', 0))

        # Family histories & severities
        db_fh = int(data.get('diabetes_fh', 0))
        db_sev = float(data.get('diabetes_severity', 0))
        ht_fh = int(data.get('hypertension_fh', 0))
        ht_sev = float(data.get('hypertension_severity', 0))
        ht_fh = int(data.get('hypertension_fh', 0))
        ht_sev = float(data.get('hypertension_severity', 0))
        ht_fh = int(data.get('hypertension_fh', 0))
        ht_sev = float(data.get('hypertension_severity', 0))
        cardio_fh = int(data.get('heart_fh', 0))
        cardio_sev = float(data.get('heart_severity', 0))
        ca_fh = int(data.get('cancer_fh', 0))
        ca_sev = float(data.get('cancer_severity', 0))
        th_fh = int(data.get('thyroid_fh', 0))
        th_sev = float(data.get('thyroid_severity', 0))
        ckd_fh = int(data.get('ckd_fh', 0))
        ckd_sev = float(data.get('ckd_severity', 0))
        ob_fh = int(data.get('obesity_fh', 0))
        ob_sev = float(data.get('obesity_severity', 0))

        # Output predictions container
        predictions = {}

        # 1. DIABETES
        if 'diabetes' in models_loaded:
            # Feature order: [Pregnancies, Glucose, BloodPressure, BMI, DiabetesPedigreeFunction, Age]
            dpf = db_sev / 100.0 * 0.5 + 0.1
            features = np.array([[0, blood_sugar, diastolic_bp, bmi, dpf, age]])
            
            # Apply scaler if present
            if 'diabetes' in scalers:
                features = scalers['diabetes'].transform(features)
            
            prob = models['diabetes'].predict_proba(features)[0][1] * 100
            predictions['diabetes_risk'] = float(prob)
        else:
            predictions['diabetes_risk'] = python_fallback_predict('diabetes', data)

        # 2. HYPERTENSION
        if 'hypertension' in models_loaded:
            # Feature order: [Age, Smoking_Status, BP_History, Exercise_Level, Sleep_Duration, BMI, Family_History, Salt_Intake, Stress_Score]
            features = np.array([[age, smoking, ht_fh, physical_activity, 7, bmi, ht_sev/100.0, 1, 5]])
            
            # Apply scaler if present
            if 'hypertension' in scalers:
                features = scalers['hypertension'].transform(features)
                
            prob = models['hypertension'].predict_proba(features)[0][1] * 100
            predictions['hypertension_risk'] = float(prob)
        else:
            predictions['hypertension_risk'] = python_fallback_predict('hypertension', data)

        # 3. HEART DISEASE
        if 'heart' in models_loaded:
            # Feature order: [age, sex, cp, trestbps, chol, fbs, restecg, thalach]
            cp_val = 1 if s_chest_pain == 1 else 0
            fbs_val = 1 if blood_sugar > 120 else 0
            features = np.array([[age, gender, cp_val, systolic_bp, cholesterol, fbs_val, ecg, max_heart_rate]])
            
            # Apply scaler if present
            if 'heart' in scalers:
                features = scalers['heart'].transform(features)
                
            prob = models['heart'].predict_proba(features)[0][1] * 100
            predictions['heart_risk'] = float(prob)
        else:
            predictions['heart_risk'] = python_fallback_predict('heart', data)

        # 4. CANCER
        if 'cancer' in models_loaded:
            # Feature order: [Age, Gender, Smoking, Alcohol, FamilyHistory, SeverityScore, PhysicalActivity]
            features = np.array([[age, gender, smoking, alcohol, ca_fh, ca_sev/100.0, physical_activity]])
            
            # Apply scaler if present
            if 'cancer' in scalers:
                features = scalers['cancer'].transform(features)
                
            prob = models['cancer'].predict_proba(features)[0][1] * 100
            predictions['cancer_risk'] = float(prob)
        else:
            predictions['cancer_risk'] = python_fallback_predict('cancer', data)

        # 5. THYROID DISORDER
        if 'thyroid' in models_loaded:
            # Feature order: [Age, Gender, TSH, FamilyHistory, SeverityScore, FatigueSymptom]
            features = np.array([[age, gender, tsh, th_fh, th_sev/100.0, s_fatigue]])
            
            # Apply scaler if present
            if 'thyroid' in scalers:
                features = scalers['thyroid'].transform(features)
                
            prob = models['thyroid'].predict_proba(features)[0][1] * 100
            predictions['thyroid_risk'] = float(prob)
        else:
            predictions['thyroid_risk'] = python_fallback_predict('thyroid', data)

        # 6. CHRONIC KIDNEY DISEASE (CKD)
        if 'ckd' in models_loaded:
            # Feature order: [Age, SystolicBP, DiastolicBP, FastingSugar, Creatinine, Haemoglobin, FamilyHistory, SeverityScore]
            features = np.array([[age, systolic_bp, diastolic_bp, blood_sugar, creatinine, haemoglobin, ckd_fh, ckd_sev/100.0]])
            
            # Apply scaler if present
            if 'ckd' in scalers:
                features = scalers['ckd'].transform(features)
                
            prob = models['ckd'].predict_proba(features)[0][1] * 100
            predictions['ckd_risk'] = float(prob)
        else:
            predictions['ckd_risk'] = python_fallback_predict('ckd', data)

        # 7. OBESITY
        if 'obesity' in models_loaded:
            # Feature order: [Age, Gender, BMI, WaistCircumference, PhysicalActivity, DietType, FamilyHistory, SeverityScore]
            diet_mapped = 0 if diet == 0 else 1  # 0 for Veg, 1 for mixed/non-veg
            features = np.array([[age, gender, bmi, waist, physical_activity, diet_mapped, ob_fh, ob_sev/100.0]])
            
            # Apply scaler if present
            if 'obesity' in scalers:
                features = scalers['obesity'].transform(features)
                
            prob = models['obesity'].predict_proba(features)[0][1] * 100
            predictions['obesity_risk'] = float(prob)
        else:
            predictions['obesity_risk'] = python_fallback_predict('obesity', data)

        # Calculate Overall Risk Level
        # Criteria: High if any single risk score is >= 70% or average risk >= 50%
        # Medium if any single risk score is >= 40%
        # Low otherwise
        all_scores = [
            predictions['diabetes_risk'],
            predictions['hypertension_risk'],
            predictions['heart_risk'],
            predictions['cancer_risk'],
            predictions['thyroid_risk'],
            predictions['ckd_risk'],
            predictions['obesity_risk']
        ]
        
        avg_score = sum(all_scores) / len(all_scores)
        max_score = max(all_scores)
        
        if max_score >= 70.0 or avg_score >= 50.0:
            overall_risk = "High"
        elif max_score >= 40.0:
            overall_risk = "Medium"
        else:
            overall_risk = "Low"

        # Identify top risks (descending order)
        disease_names = {
            'Diabetes': predictions['diabetes_risk'],
            'Hypertension': predictions['hypertension_risk'],
            'Heart Disease': predictions['heart_risk'],
            'Cancer': predictions['cancer_risk'],
            'Thyroid Disorder': predictions['thyroid_risk'],
            'Chronic Kidney Disease': predictions['ckd_risk'],
            'Obesity': predictions['obesity_risk']
        }
        
        # Sort and select top 3 risks
        sorted_risks = sorted(disease_names.items(), key=lambda item: item[1], reverse=True)
        top_risks = [item[0] for item in sorted_risks[:3]]

        # Prepare response matches expected format
        response = {
            "diabetes_risk": round(predictions['diabetes_risk'], 1),
            "hypertension_risk": round(predictions['hypertension_risk'], 1),
            "heart_risk": round(predictions['heart_risk'], 1),
            "cancer_risk": round(predictions['cancer_risk'], 1),
            "thyroid_risk": round(predictions['thyroid_risk'], 1),
            "ckd_risk": round(predictions['ckd_risk'], 1),
            "obesity_risk": round(predictions['obesity_risk'], 1),
            "overall_risk": overall_risk,
            "top_risks": top_risks
        }
        
        return jsonify(response)

    except Exception as e:
        print(f"Error handling prediction request: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Run Flask server locally on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
