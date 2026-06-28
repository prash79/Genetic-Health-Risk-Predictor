# 🧬 Genetic Health Risk Predictor

An AI-powered web application that estimates the risk of common hereditary diseases using Machine Learning, Flask, and an interactive web interface.

---

# 📖 Overview

Genetic Health Risk Predictor is a machine learning web application that estimates the likelihood of developing common hereditary diseases using user-provided health information and family medical history.

The application combines multiple trained Scikit-learn models with a Flask REST API and a lightweight frontend built with HTML, CSS, and JavaScript.

---

# ✨ Features

* Predicts risk for multiple hereditary diseases
* Interactive web interface
* Flask REST API backend
* Real-time machine learning predictions
* Multiple trained disease prediction models
* Health monitoring endpoint (`/health`)
* Clean and modular project structure

---

# 🩺 Supported Diseases

* Diabetes
* Hypertension
* Heart Disease
* Cancer
* Thyroid Disorders
* Chronic Kidney Disease (CKD)
* Obesity

---

# 🛠️ Tech Stack

## Frontend

* HTML5
* CSS3
* JavaScript

## Backend

* Python
* Flask

## Machine Learning

* Scikit-learn
* Joblib
* NumPy
* Pandas

---

# 📂 Project Structure

```
Genetic-Health-Risk-Predictor
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── models/
│       ├── diabetes_model.pkl
│       ├── diabetes_scaler.pkl
│       ├── ...
├── index.html
├── style.css
├── script.js
├── README.md
└── .gitignore
```

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/prash79/Genetic-Health-Risk-Predictor.git

cd Genetic-Health-Risk-Predictor
```

---

## 2. Install backend dependencies

```bash
cd backend

pip install -r requirements.txt
```

---

## 3. Start the Flask Backend

```bash
python app.py
```

The backend will be available at:

```
http://127.0.0.1:5000
```

You can verify it is running by opening:

```
http://127.0.0.1:5000/health
```

---

## 4. Launch the Frontend

Open another terminal in the project root and run:

```bash
python -m http.server 8000
```

Open your browser and visit:

```
http://localhost:8000
```

---

# ⚠️ Important

The prediction functionality requires the Flask backend to be running.

If the backend is not started, the website interface will load normally, but prediction requests will fail because the frontend communicates with the Flask API running on:

```
http://127.0.0.1:5000
```

---

# 🔌 API Endpoints

## Health Check

```
GET /health
```

Returns backend status and model information.

---

## Prediction

```
POST /predict
```

Accepts user health information and returns disease risk predictions.

---

# 🧠 Machine Learning Workflow

1. User enters health information.
2. The frontend sends the data to the Flask backend.
3. Flask preprocesses the input.
4. The appropriate trained machine learning model is loaded.
5. A prediction is generated.
6. The prediction is returned to the frontend.
7. Results are displayed to the user.

---




---

---

# 📚 Learning Outcomes

This project demonstrates practical experience with:

* Machine Learning model deployment
* Flask REST API development
* Frontend–backend integration
* Joblib model serialization
* Web application development
* Git and GitHub workflow

---

# ⚠️ Disclaimer

It is **not** a medical diagnostic tool and should not be used as a substitute for professional medical advice, diagnosis, or treatment.

---

# 👨‍💻 Author

**Prashanth Kumar**

GitHub: https://github.com/prash79

---

