# 🧬 Genetic Health Risk Predictor

An AI-powered web application that estimates the risk of common hereditary diseases using Machine Learning, Flask, and a user-friendly web interface.

> **Kaggle Capstone Project**

---

## 📖 Overview

Genetic Health Risk Predictor is a machine learning web application designed to estimate the likelihood of developing common hereditary diseases based on user-provided health information and family medical history.

The application integrates multiple trained machine learning models into a Flask backend and provides predictions through a simple, interactive web interface.

---

## ✨ Features

- Predicts risk for multiple hereditary diseases
- Interactive and responsive web interface
- REST API powered by Flask
- Real-time predictions using trained ML models
- Modular backend architecture
- Health check endpoint for backend monitoring

---

## 🩺 Supported Diseases

- Diabetes
- Hypertension
- Heart Disease
- Cancer
- Thyroid Disorders
- Chronic Kidney Disease (CKD)
- Obesity

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Python
- Flask

### Machine Learning

- Scikit-learn
- Joblib
- NumPy
- Pandas

---

## 📂 Project Structure

```
Genetic-Health-Risk-Predictor
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── models/

├── index.html
├── style.css
├── script.js
├── README.md
└── .gitignore
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/prash79/Genetic-Health-Risk-Predictor.git

cd Genetic-Health-Risk-Predictor
```

---

### 2. Install backend dependencies

```bash
cd backend

pip install -r requirements.txt
```

---

### 3. Start the Flask server

```bash
python app.py
```

The backend will start on:

```
http://127.0.0.1:5000
```

---

### 4. Launch the frontend

Open

```
index.html
```

in your browser.

---

## 🔌 API Endpoints

### Health Check

```
GET /health
```

Returns the backend status and information about loaded models.

---

### Prediction

```
POST /predict
```

Accepts user health information and returns disease risk predictions.

---

## 🧠 Machine Learning Pipeline

1. User enters health information.
2. The frontend sends the data to the Flask backend.
3. Flask preprocesses the input.
4. The corresponding trained machine learning model is loaded.
5. The prediction is generated.
6. Results are returned to the frontend and displayed to the user.

---

## 📸 Screenshots

### Home Page

*(Add screenshot here)*

---

### Prediction Form

*(Add screenshot here)*

---

### Prediction Results

*(Add screenshot here)*

---

## 🚀 Future Improvements

- User authentication
- Database integration
- Cloud deployment
- Prediction history
- Explainable AI (XAI)
- Improved visual analytics
- Additional disease prediction models

---

## 📚 Learning Outcomes

This project demonstrates practical experience with:

- Machine Learning model deployment
- Flask REST APIs
- Frontend–backend integration
- Model serialization using Joblib
- Web application development
- Git and GitHub workflow

---

## ⚠️ Disclaimer

This application is intended for educational and research purposes only.

It is **not** a medical diagnostic tool and should not be used as a substitute for professional medical advice, diagnosis, or treatment.

---

## 👨‍💻 Author

**Prashanth Kumar**

GitHub:
https://github.com/prash79

---

## 📄 License

This project is licensed under the MIT License.
