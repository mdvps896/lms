# Duralux Backend API Documentation (Checks & Endpoints)

This file contains a list of all API endpoints and verification checks used in the mobile and web application.

---

## 🔐 1. Authentication & Integrity Checks (`/api/auth`)

### ✅ Check Registration Status
*Check if the admin has enabled or disabled the "Create Account" feature.*
- **URL:** `/api/auth/check-registration-enabled`
- **Method:** `GET`
- **Response:**
  ```json
  { "success": true, "registrationEnabled": true }
  ```

### ✅ Check User Existence
*Check if an email is already registered before showing login/register options.*
- **URL:** `/api/auth/check-user`
- **Method:** `POST`
- **Body:** `{ "email": "user@example.com" }`
- **Response:**
  ```json
  { "success": true, "userExists": true, "user": { "role": "student", "isGoogleAuth": false } }
  ```

### 🗝️ Login Check
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Conditions:** 
  - Returns `requiresTwoFactor: true` if 2FA is on.
  - Returns `emailNotVerified: true` if student hasn't verified email.
  - Returns `locked: true` if too many failed attempts (Admin).

---

## 📝 2. Verification Endpoints

### 📧 OTP Verification
- **URL:** `/api/auth/verify-registration-otp`
- **Method:** `POST`
- **Body:** `email`, `otp`, `name`, `mobile`, `password`.

### 🛡️ 2FA Verification
- **URL:** `/api/auth/verify-2fa`
- **Method:** `POST`
- **Body:** `userId`, `otp`.

---

## 📊 3. Exam & Student Checks

### 📝 Exam Attempt Check
*Check if a student can still attempt an exam (checks limit).*
- **URL:** `/api/exams/check-attempts`
- **Method:** `POST`
- **Body:** `{ "examId": "...", "userId": "..." }`

### ⚡ Live Status Check
*Check if an exam is currently active or has ended.*
- **URL:** `/api/exam-status-check`
- **Method:** `GET`
- **Query:** `?examId=...`

---

## ⚙️ 4. System Settings (`/api/settings`)

### 🌐 Global Settings Check
*Get the entire system config (site name, logos, colors).*
- **URL:** `/api/settings`
- **Method:** `GET`

---

## 📡 5. Mobile Connection Setup
*   **Backend Network:** `npm run dev:network` (Runs on `http://0.0.0.0:3000`)
*   **Mobile API URL:** Update `.env` with `http://[COMPUTER_IP]:3000/api`
