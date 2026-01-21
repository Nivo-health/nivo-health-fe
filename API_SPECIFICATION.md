# Clinic OPD Management System - API Specification

## Base URL
```
/api/v1
```

## Authentication
*Note: Based on requirements, no login is needed. If authentication is required later, add JWT tokens.*

---

## 1. Patient APIs

### 1.1 Search Patients
**GET** `/patients/search`

Search patients by name or mobile number.

**Query Parameters:**
- `q` (string, required): Search query (minimum 2-3 characters)
- `limit` (number, optional): Number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "patient_123",
      "name": "Ramesh Patil",
      "mobile": "9898765412",
      "age": 45,
      "gender": "M",
      "createdAt": "2025-01-10T10:30:00Z",
      "lastVisitDate": "2025-01-12T14:20:00Z"
    }
  ]
}
```

### 1.2 Get Patient by ID
**GET** `/patients/:patientId`

Get patient details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "patient_123",
    "name": "Ramesh Patil",
    "mobile": "9898765412",
    "age": 45,
    "gender": "M",
    "createdAt": "2025-01-10T10:30:00Z"
  }
}
```

### 1.3 Create New Patient
**POST** `/patients`

Create a new patient record.

**Request Body:**
```json
{
  "name": "Ramesh Patil",
  "mobile": "9898765412",
  "age": 45,
  "gender": "M"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "patient_123",
    "name": "Ramesh Patil",
    "mobile": "9898765412",
    "age": 45,
    "gender": "M",
    "createdAt": "2025-01-12T15:30:00Z"
  }
}
```

### 1.4 Get Recent Patients
**GET** `/patients/recent`

Get recently visited patients (for quick access).

**Query Parameters:**
- `limit` (number, optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "patient_123",
      "name": "Ramesh Patil",
      "mobile": "9898765412",
      "lastVisitDate": "2025-01-12T14:20:00Z"
    }
  ]
}
```

---

## 2. Visit APIs

### 2.1 Create New Visit
**POST** `/visits`

Create a new visit for a patient. This is called when a new patient is registered or when starting a new visit.

**Request Body:**
```json
{
  "patientId": "patient_123",
  "date": "2025-01-12T15:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_456",
    "patientId": "patient_123",
    "date": "2025-01-12T15:30:00Z",
    "status": "active",
    "notes": null,
    "prescription": null,
    "followUp": null
  }
}
```

### 2.2 Get Visit by ID
**GET** `/visits/:visitId`

Get visit details including prescription.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_456",
    "patientId": "patient_123",
    "date": "2025-01-12T15:30:00Z",
    "status": "completed",
    "notes": "Patient complains of pain...",
    "prescription": {
      "medicines": [
        {
          "id": "med_1",
          "name": "Crocin",
          "dosage": "1-0-1",
          "duration": "5 days",
          "notes": ""
        }
      ],
      "followUp": {
        "value": 7,
        "unit": "days"
      }
    }
  }
}
```

### 2.3 Get Patient Visit History
**GET** `/visits/patient/:patientId`

Get all visits for a specific patient (for visit history display).

**Query Parameters:**
- `limit` (number, optional): Number of results (default: 20)
- `status` (string, optional): Filter by status ('active' | 'completed')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "visit_456",
      "date": "2025-01-12T15:30:00Z",
      "status": "completed",
      "hasPrescription": true
    },
    {
      "id": "visit_455",
      "date": "2025-01-05T10:15:00Z",
      "status": "completed",
      "hasPrescription": true
    }
  ]
}
```

### 2.4 Update Visit Notes
**PATCH** `/visits/:visitId/notes`

Update consultation notes for a visit (auto-save functionality).

**Request Body:**
```json
{
  "notes": "Patient complains of pain in the lower back..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_456",
    "notes": "Patient complains of pain in the lower back..."
  }
}
```

### 2.5 Update Visit Prescription
**PATCH** `/visits/:visitId/prescription`

Save or update prescription for a visit.

**Request Body:**
```json
{
  "medicines": [
    {
      "name": "Crocin",
      "dosage": "1-0-1",
      "duration": "5 days",
      "notes": ""
    }
  ],
  "followUp": {
    "value": 7,
    "unit": "days"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_456",
    "prescription": {
      "medicines": [
        {
          "id": "med_1",
          "name": "Crocin",
          "dosage": "1-0-1",
          "duration": "5 days",
          "notes": ""
        }
      ],
      "followUp": {
        "value": 7,
        "unit": "days"
      }
    }
  }
}
```

### 2.6 Complete Visit
**PATCH** `/visits/:visitId/complete`

Mark a visit as completed and finish the consultation.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_456",
    "status": "completed"
  }
}
```

### 2.7 Get Old Visit (Read-only)
**GET** `/visits/:visitId/readonly`

Get a completed visit with prescription (for viewing old prescriptions).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_455",
    "patientId": "patient_123",
    "date": "2025-01-05T10:15:00Z",
    "status": "completed",
    "notes": "Previous consultation notes...",
    "prescription": {
      "medicines": [
        {
          "id": "med_1",
          "name": "Paracetamol",
          "dosage": "1-0-1",
          "duration": "3 days",
          "notes": ""
        }
      ],
      "followUp": {
        "value": 3,
        "unit": "days"
      }
    }
  }
}
```

---

## 3. WhatsApp APIs (Mock/Integration)

### 3.1 Send Visit Confirmation
**POST** `/whatsapp/visit-confirmation`

Send visit confirmation message to patient (mock implementation).

**Request Body:**
```json
{
  "patientId": "patient_123",
  "visitId": "visit_456",
  "mobile": "9898765412"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp message sent to +919898765412",
  "data": {
    "sent": true,
    "timestamp": "2025-01-12T15:35:00Z"
  }
}
```

### 3.2 Send Prescription
**POST** `/whatsapp/prescription`

Send prescription to patient via WhatsApp (mock implementation).

**Request Body:**
```json
{
  "patientId": "patient_123",
  "visitId": "visit_456",
  "mobile": "9898765412",
  "prescription": {
    "medicines": [
      {
        "name": "Crocin",
        "dosage": "1-0-1",
        "duration": "5 days"
      }
    ],
    "followUp": {
      "value": 7,
      "unit": "days"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription sent on WhatsApp",
  "data": {
    "sent": true,
    "timestamp": "2025-01-12T16:00:00Z"
  }
}
```

---

## 4. Clinic Configuration APIs (Optional)

### 4.1 Get Clinic Information
**GET** `/clinic/info`

Get clinic name and other configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "ABC Clinic",
    "address": "123 Main Street",
    "phone": "9876543210",
    "email": "info@abcclinic.com"
  }
}
```

---

## Error Response Format

All APIs return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient with ID patient_123 not found",
    "statusCode": 404
  }
}
```

## Common HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## API Usage Flow Examples

### Flow 1: New Patient Registration & Visit
1. `POST /patients` - Create patient
2. `POST /visits` - Create visit for new patient
3. `GET /visits/:visitId` - Load visit context

### Flow 2: Existing Patient Visit
1. `GET /patients/search?q=ramesh` - Search patient
2. `GET /visits/patient/:patientId` - Get visit history
3. `POST /visits` - Create new visit
4. `GET /visits/:visitId` - Load visit context

### Flow 3: Consultation & Prescription
1. `PATCH /visits/:visitId/notes` - Save consultation notes
2. `PATCH /visits/:visitId/prescription` - Save prescription
3. `PATCH /visits/:visitId/complete` - Complete visit
4. `POST /whatsapp/prescription` - Send prescription (optional)

### Flow 4: View Old Prescription
1. `GET /visits/:visitId/readonly` - Get old visit details
