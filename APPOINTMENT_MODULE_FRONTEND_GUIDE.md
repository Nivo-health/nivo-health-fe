# Appointment Module - Frontend Integration Guide

This guide covers the complete slot-based appointment scheduling system. The old `appointment_date_time` field has been removed. All appointments are now created by **booking a slot**.

> **Base URL:** `/api`
> **Auth:** All endpoints (except public ones) require JWT via `Authorization: Bearer <token>` header.
> **Date format:** `DD-MM-YYYY` (e.g. `08-02-2026`)
> **Time format:** `HH:MM` 24-hour (e.g. `09:00`, `14:30`)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Setup Flow (Admin/Doctor)](#2-setup-flow-admindoctor)
3. [API Reference - Doctor Schedule](#3-api-reference---doctor-schedule)
4. [API Reference - Slots](#4-api-reference---slots)
5. [API Reference - Appointments (Read/Update)](#5-api-reference---appointments-readupdate)
6. [Migration from Old API](#6-migration-from-old-api)
7. [Enums & Constants](#7-enums--constants)
8. [Error Handling](#8-error-handling)
9. [UI Recommendations (Calendly-style)](#9-ui-recommendations-calendly-style)

---

## 1. Architecture Overview

```
Doctor Setup (one-time)          Patient Booking Flow
========================         ========================
1. Set Working Hours       -->   1. Select Doctor
2. Mark Off Days           -->   2. Pick Date (calendar)
                                 3. See Available Slots
                                 4. Book a Slot
                                 5. Appointment Created
```

**Key concepts:**

- **Working Hours** define when a doctor is available each week (recurring by day-of-week).
- **Off Days** block out specific dates (holidays, leave).
- **Slots** are computed on-the-fly from working hours. They are NOT stored in DB until booked/blocked.
- **Booking** a slot creates both an `AppointmentSlot` (BOOKED) and an `Appointment` atomically.
- **Blocking** a slot (by the doctor/admin) prevents patients from booking that time.

---

## 2. Setup Flow (Admin/Doctor)

Before patients can book appointments, a doctor's schedule must be configured. Build a **Doctor Settings** page with two sections:

### Step 1: Configure Working Hours

The doctor/admin sets weekly recurring time ranges. A doctor can have multiple ranges per day (e.g., Morning 09:00-13:00 + Evening 16:00-19:00).

### Step 2: Mark Off Days (Optional)

The doctor/admin marks specific dates when the doctor won't be available.

### Step 3: Block Specific Slots (Optional)

The doctor/admin can block individual time slots on specific dates.

---

## 3. API Reference - Doctor Schedule

### 3.1 Create Working Hour

```
POST /api/doctor-schedule/working-hours
```

**Request Body:**

```json
{
  "doctor_id": "uuid-of-doctor",
  "day_of_week": 0,
  "start_time": "09:00",
  "end_time": "13:00",
  "slot_duration_minutes": 15
}
```

| Field                   | Type   | Required | Description                                      |
| ----------------------- | ------ | -------- | ------------------------------------------------ |
| `doctor_id`             | UUID   | Yes      | ClinicMember (doctor) ID                         |
| `day_of_week`           | int    | Yes      | 0=Monday, 1=Tuesday, ... 6=Sunday                |
| `start_time`            | string | Yes      | HH:MM format (24-hour)                           |
| `end_time`              | string | Yes      | HH:MM format (24-hour), must be after start_time |
| `slot_duration_minutes` | int    | No       | Default: 15. Range: 5-120                        |

**Response (201):**

```json
{
  "id": "uuid",
  "created_at": "2026-02-08T10:00:00",
  "updated_at": "2026-02-08T10:00:00",
  "doctor": {
    "id": "uuid",
    "name": "Dr. Smith",
    "mobile_number": "+919876543210",
    "email": "smith@clinic.com",
    "role": "DOCTOR"
  },
  "day_of_week": 0,
  "day_of_week_label": "Monday",
  "start_time": "09:00:00",
  "end_time": "13:00:00",
  "slot_duration_minutes": 15,
  "is_active": true
}
```

**Typical setup** - Create multiple entries for a full week:

```
Monday:    09:00-13:00, 16:00-19:00
Tuesday:   09:00-13:00, 16:00-19:00
Wednesday: 09:00-13:00
Thursday:  09:00-13:00, 16:00-19:00
Friday:    09:00-13:00, 16:00-19:00
Saturday:  10:00-14:00
```

This means 11 separate POST calls (one per time range).

---

### 3.2 Get Working Hours

```
GET /api/doctor-schedule/working-hours
GET /api/doctor-schedule/working-hours?doctor_id=uuid
```

| Query Param | Type | Required | Description                                                  |
| ----------- | ---- | -------- | ------------------------------------------------------------ |
| `doctor_id` | UUID | No       | Filter by doctor. If omitted, returns all doctors in clinic. |

**Response (200):**

```json
[
  {
    "id": "uuid-1",
    "doctor": { "id": "uuid", "name": "Dr. Smith", ... },
    "day_of_week": 0,
    "day_of_week_label": "Monday",
    "start_time": "09:00:00",
    "end_time": "13:00:00",
    "slot_duration_minutes": 15,
    "is_active": true
  },
  {
    "id": "uuid-2",
    "doctor": { "id": "uuid", "name": "Dr. Smith", ... },
    "day_of_week": 0,
    "day_of_week_label": "Monday",
    "start_time": "16:00:00",
    "end_time": "19:00:00",
    "slot_duration_minutes": 15,
    "is_active": true
  }
]
```

---

### 3.3 Update Working Hour

```
PUT /api/doctor-schedule/working-hours/{id}
```

**Request Body** (all fields optional):

```json
{
  "start_time": "10:00",
  "end_time": "14:00",
  "slot_duration_minutes": 20,
  "is_active": false
}
```

**Response:** Same as create response with updated values.

---

### 3.4 Delete Working Hour

```
DELETE /api/doctor-schedule/working-hours/{id}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Working hour deleted"
}
```

---

### 3.5 Create Off Day

```
POST /api/doctor-schedule/off-days
```

**Request Body:**

```json
{
  "doctor_id": "uuid-of-doctor",
  "date": "14-02-2026",
  "reason": "Valentine's Day holiday"
}
```

| Field       | Type   | Required | Description                               |
| ----------- | ------ | -------- | ----------------------------------------- |
| `doctor_id` | UUID   | Yes      | ClinicMember (doctor) ID                  |
| `date`      | string | Yes      | DD-MM-YYYY format. Cannot be in the past. |
| `reason`    | string | No       | Optional reason                           |

**Response (201):**

```json
{
  "id": "uuid",
  "created_at": "2026-02-08T10:00:00",
  "updated_at": "2026-02-08T10:00:00",
  "doctor": {
    "id": "uuid",
    "name": "Dr. Smith",
    "mobile_number": "+919876543210",
    "email": "smith@clinic.com",
    "role": "DOCTOR"
  },
  "date": "2026-02-14",
  "reason": "Valentine's Day holiday"
}
```

---

### 3.6 Get Off Days

```
GET /api/doctor-schedule/off-days
GET /api/doctor-schedule/off-days?doctor_id=uuid&start_date=01-02-2026&end_date=28-02-2026
```

| Query Param  | Type   | Required | Description      |
| ------------ | ------ | -------- | ---------------- |
| `doctor_id`  | UUID   | No       | Filter by doctor |
| `start_date` | string | No       | DD-MM-YYYY       |
| `end_date`   | string | No       | DD-MM-YYYY       |

**Response (200):**

```json
[
  {
    "id": "uuid",
    "doctor": { "id": "uuid", "name": "Dr. Smith", ... },
    "date": "2026-02-14",
    "reason": "Valentine's Day holiday"
  }
]
```

---

### 3.7 Delete Off Day

```
DELETE /api/doctor-schedule/off-days/{id}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Off day deleted"
}
```

---

## 4. API Reference - Slots

### 4.1 Get Available Slots (Main Booking API)

This is the primary API for the patient booking calendar. It returns available time slots grouped by date.

```
GET /api/slots/available?doctor_id=uuid&start_date=08-02-2026&end_date=22-02-2026
```

| Query Param  | Type   | Required | Description                                            |
| ------------ | ------ | -------- | ------------------------------------------------------ |
| `doctor_id`  | UUID   | Yes      | Doctor to check availability for                       |
| `start_date` | string | Yes      | DD-MM-YYYY. Start of date range.                       |
| `end_date`   | string | Yes      | DD-MM-YYYY. End of date range. Max 30 days from start. |

**Response (200):**

```json
{
  "doctor_id": "uuid-of-doctor",
  "start_date": "2026-02-08",
  "end_date": "2026-02-22",
  "days": [
    {
      "date": "2026-02-09",
      "day_of_week": "Monday",
      "slots": [
        {
          "start_time": "09:00:00",
          "end_time": "09:15:00",
          "status": "AVAILABLE"
        },
        {
          "start_time": "09:15:00",
          "end_time": "09:30:00",
          "status": "AVAILABLE"
        },
        {
          "start_time": "09:30:00",
          "end_time": "09:45:00",
          "status": "AVAILABLE"
        },
        {
          "start_time": "09:45:00",
          "end_time": "10:00:00",
          "status": "AVAILABLE"
        },
        {
          "start_time": "10:00:00",
          "end_time": "10:15:00",
          "status": "AVAILABLE"
        },
        {
          "start_time": "16:00:00",
          "end_time": "16:15:00",
          "status": "AVAILABLE"
        },
        {
          "start_time": "16:15:00",
          "end_time": "16:30:00",
          "status": "AVAILABLE"
        }
      ]
    },
    {
      "date": "2026-02-10",
      "day_of_week": "Tuesday",
      "slots": [
        {
          "start_time": "09:00:00",
          "end_time": "09:15:00",
          "status": "AVAILABLE"
        },
        {
          "start_time": "09:15:00",
          "end_time": "09:30:00",
          "status": "AVAILABLE"
        }
      ]
    }
  ]
}
```

**Notes:**

- Days with no available slots (off days, no working hours, fully booked) are **excluded** from the response.
- Past time slots for today are automatically excluded.
- Booked and blocked slots are already filtered out -- only AVAILABLE slots are returned.
- The `days` array is ordered chronologically.

---

### 4.2 Book a Slot

This is how appointments are now created. **Replaces the old `POST /api/appointments`.**

```
POST /api/slots/book
```

**Request Body:**

```json
{
  "doctor_id": "uuid-of-doctor",
  "date": "09-02-2026",
  "start_time": "09:00",
  "name": "Rahul Kumar",
  "mobile_number": "+919876543210",
  "gender": "MALE",
  "source": "PHONE"
}
```

| Field           | Type   | Required | Description                                                                   |
| --------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `doctor_id`     | UUID   | Yes      | ClinicMember (doctor) ID                                                      |
| `date`          | string | Yes      | DD-MM-YYYY format. Cannot be in the past.                                     |
| `start_time`    | string | Yes      | HH:MM format. Must match an available slot.                                   |
| `name`          | string | Yes      | Patient name                                                                  |
| `mobile_number` | string | Yes      | Patient phone number (E.164 format preferred)                                 |
| `gender`        | string | Yes      | `MALE`, `FEMALE`, or `OTHER`                                                  |
| `source`        | string | No       | Default: `PHONE`. Options: `PHONE`, `WHATSAPP`, `WALK_IN`, `WEBSITE`, `OTHER` |

**Response (200) - Appointment created:**

```json
{
  "id": "appointment-uuid",
  "created_at": "2026-02-08T10:30:00",
  "updated_at": "2026-02-08T10:30:00",
  "name": "Rahul Kumar",
  "mobile_number": "+919876543210",
  "gender": "MALE",
  "doctor": {
    "id": "doctor-uuid",
    "name": "Dr. Smith",
    "mobile_number": "+919876543211",
    "email": "smith@clinic.com",
    "role": "DOCTOR"
  },
  "clinic_id": "clinic-uuid",
  "slot": {
    "id": "slot-uuid",
    "created_at": "2026-02-08T10:30:00",
    "updated_at": "2026-02-08T10:30:00",
    "date": "2026-02-09",
    "start_time": "09:00:00",
    "end_time": "09:15:00",
    "slot_status": "BOOKED"
  },
  "appointment_status": "WAITING",
  "source": "PHONE"
}
```

**Error responses:**

| Status | Code          | When                                                                |
| ------ | ------------- | ------------------------------------------------------------------- |
| 400    | `BAD_REQUEST` | Date in the past, no working hours for this time, doctor on off day |
| 409    | `CONFLICT`    | Slot already booked or blocked (race condition handled)             |
| 404    | `NOT_FOUND`   | Doctor not found in clinic                                          |

---

### 4.3 Block a Slot (Admin/Doctor)

Prevents a specific time slot from being booked.

```
POST /api/slots/block
```

**Request Body:**

```json
{
  "doctor_id": "uuid-of-doctor",
  "date": "09-02-2026",
  "start_time": "09:00"
}
```

**Response (200):**

```json
{
  "id": "slot-uuid",
  "created_at": "2026-02-08T10:00:00",
  "updated_at": "2026-02-08T10:00:00",
  "date": "2026-02-09",
  "start_time": "09:00:00",
  "end_time": "09:15:00",
  "slot_status": "BLOCKED"
}
```

---

### 4.4 Unblock a Slot

```
DELETE /api/slots/block/{slot_id}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Slot unblocked"
}
```

---

## 5. API Reference - Appointments (Read/Update)

These existing APIs continue to work but now return slot data instead of `appointment_date_time`.

### 5.1 Get All Appointments

```
GET /api/appointments/all/appointments?date=08-02-2026&doctor_id=uuid
```

| Query Param | Type   | Required | Description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| `date`      | string | No       | DD-MM-YYYY. Filters by slot date.   |
| `doctor_id` | UUID   | No       | Filter by doctor                    |
| `page`      | int    | No       | Default: 1. Paginated, 20 per page. |

**Response (200):**

```json
{
  "items": [
    {
      "id": "appointment-uuid",
      "created_at": "2026-02-08T10:30:00",
      "updated_at": "2026-02-08T10:30:00",
      "name": "Rahul Kumar",
      "mobile_number": "+919876543210",
      "gender": "MALE",
      "doctor": {
        "id": "doctor-uuid",
        "name": "Dr. Smith",
        "mobile_number": "+919876543211",
        "email": "smith@clinic.com",
        "role": "DOCTOR"
      },
      "clinic_id": "clinic-uuid",
      "slot": {
        "id": "slot-uuid",
        "created_at": "2026-02-08T10:30:00",
        "updated_at": "2026-02-08T10:30:00",
        "date": "2026-02-09",
        "start_time": "09:00:00",
        "end_time": "09:15:00",
        "slot_status": "BOOKED"
      },
      "appointment_status": "WAITING",
      "source": "PHONE"
    }
  ],
  "count": 1
}
```

> **Note:** CHECKED_IN appointments are excluded from this list.

---

### 5.2 Get Single Appointment

```
GET /api/appointments/{id}
```

**Response:** Same shape as a single item from the list above.

---

### 5.3 Update Appointment (Status/Source only)

```
PUT /api/appointments/{id}
```

**Request Body:**

```json
{
  "appointment_status": "CHECKED_IN",
  "source": "WALK_IN"
}
```

| Field                | Type   | Required | Description                                        |
| -------------------- | ------ | -------- | -------------------------------------------------- |
| `appointment_status` | string | No       | `WAITING`, `CHECKED_IN`, `NO_SHOW`                 |
| `source`             | string | No       | `PHONE`, `WHATSAPP`, `WALK_IN`, `WEBSITE`, `OTHER` |

> **Important:** When status changes to `CHECKED_IN`, the system automatically creates a Patient record (if new) and a Visit record linked to this appointment.

---

### 5.4 Get Appointments by Patient Mobile Number

```
GET /api/appointments/patient/{mobile_number}
```

**Response:** Array of appointments.

---

## 6. Migration from Old API

### What changed

| Old API                                               | New API                                           | Notes                                     |
| ----------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| `POST /api/appointments` with `appointment_date_time` | `POST /api/slots/book` with `date` + `start_time` | Completely replaced                       |
| `appointment_date_time` field in response             | `slot` object in response                         | Contains `date`, `start_time`, `end_time` |
| Filter by `appointment_date_time__date`               | Filter by `slot.date`                             | Query param `date` still works the same   |

### Frontend changes required

1. **Remove** the old appointment creation form that had a free datetime picker.
2. **Add** the new Calendly-style slot picker (see UI section below).
3. **Update** appointment list/cards to read date/time from `appointment.slot.date` and `appointment.slot.start_time` instead of `appointment.appointment_date_time`.
4. **Add** a Doctor Settings page for working hours and off days management.

### Reading appointment date/time from the new response

```typescript
// OLD
const appointmentDate = appointment.appointment_date_time;

// NEW
const appointmentDate = appointment.slot?.date; // "2026-02-09"
const appointmentTime = appointment.slot?.start_time; // "09:00:00"
const appointmentEndTime = appointment.slot?.end_time; // "09:15:00"

// Format for display
const displayDate = new Date(appointmentDate).toLocaleDateString();
const displayTime = appointmentTime.slice(0, 5); // "09:00"
```

---

## 7. Enums & Constants

### Day of Week

| Value | Label     |
| ----- | --------- |
| 0     | Monday    |
| 1     | Tuesday   |
| 2     | Wednesday |
| 3     | Thursday  |
| 4     | Friday    |
| 5     | Saturday  |
| 6     | Sunday    |

### Slot Status

| Value       | Description                                                         |
| ----------- | ------------------------------------------------------------------- |
| `AVAILABLE` | Virtual slot, can be booked (only in GET /slots/available response) |
| `BOOKED`    | Slot is booked with an appointment                                  |
| `BLOCKED`   | Slot is blocked by doctor/admin                                     |

### Appointment Status

| Value        | Description                                 |
| ------------ | ------------------------------------------- |
| `WAITING`    | Appointment created, patient hasn't arrived |
| `CHECKED_IN` | Patient has checked in (auto-creates visit) |
| `NO_SHOW`    | Patient didn't show up                      |

### Appointment Source

| Value      | Description           |
| ---------- | --------------------- |
| `PHONE`    | Booked via phone call |
| `WHATSAPP` | Booked via WhatsApp   |
| `WALK_IN`  | Walk-in booking       |
| `WEBSITE`  | Booked via website    |
| `OTHER`    | Other source          |

### Gender

| Value    |
| -------- |
| `MALE`   |
| `FEMALE` |
| `OTHER`  |

---

## 8. Error Handling

All errors follow this standard format:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "This slot is already booked",
    "details": {
      "date": "2026-02-09",
      "start_time": "09:00:00",
      "slot_status": "BOOKED"
    },
    "meta": {}
  }
}
```

### Common error codes for this module

| HTTP Status | Code               | Scenario                                                              |
| ----------- | ------------------ | --------------------------------------------------------------------- |
| 400         | `BAD_REQUEST`      | Invalid date format, date in past, no working hours for time, off day |
| 401         | `UNAUTHORIZED`     | Missing or invalid JWT token                                          |
| 404         | `NOT_FOUND`        | Doctor/appointment/working-hour not found                             |
| 409         | `CONFLICT`         | Slot already booked/blocked, working hours overlap, duplicate off day |
| 422         | `VALIDATION_ERROR` | Missing required fields, invalid field values                         |

---

## 9. UI Recommendations (Calendly-style)

### Page 1: Doctor Settings (Admin Panel)

Build a settings page accessible to doctors/admins.

#### Working Hours Section

```
+-----------------------------------------------+
|  Doctor Schedule Settings                      |
+-----------------------------------------------+
|  Select Doctor: [ Dr. Smith       v ]          |
|                                                |
|  Weekly Working Hours                          |
|  ┌─────────────────────────────────────────┐   |
|  │ Monday                                  │   |
|  │   09:00 - 13:00  (15 min slots) [Edit][X]  |
|  │   16:00 - 19:00  (15 min slots) [Edit][X]  |
|  │                          [+ Add Range]  │   |
|  ├─────────────────────────────────────────┤   |
|  │ Tuesday                                 │   |
|  │   09:00 - 13:00  (15 min slots) [Edit][X]  |
|  │                          [+ Add Range]  │   |
|  ├─────────────────────────────────────────┤   |
|  │ Wednesday                               │   |
|  │   No hours set         [+ Add Range]    │   |
|  └─────────────────────────────────────────┘   |
+-----------------------------------------------+
```

**Implementation:**

1. On page load, call `GET /api/doctor-schedule/working-hours?doctor_id=<id>`.
2. Group response by `day_of_week` (0-6).
3. For each day, show the time ranges.
4. "Add Range" opens a form with `start_time`, `end_time`, `slot_duration_minutes`.
5. Save calls `POST /api/doctor-schedule/working-hours`.
6. Edit calls `PUT /api/doctor-schedule/working-hours/{id}`.
7. Delete calls `DELETE /api/doctor-schedule/working-hours/{id}`.

#### Off Days Section

```
+-----------------------------------------------+
|  Off Days / Holidays                           |
|  ┌─────────────────────────────────────────┐   |
|  │ 14 Feb 2026 - Valentine's Day     [X]   │   |
|  │ 26 Jan 2026 - Republic Day        [X]   │   |
|  └─────────────────────────────────────────┘   |
|                                                |
|  [+ Add Off Day]                               |
|  Date: [  DD-MM-YYYY  ]  Reason: [________]    |
+-----------------------------------------------+
```

**Implementation:**

1. Call `GET /api/doctor-schedule/off-days?doctor_id=<id>`.
2. "Add Off Day" calls `POST /api/doctor-schedule/off-days`.
3. Delete calls `DELETE /api/doctor-schedule/off-days/{id}`.

---

### Page 2: Slot Booking (Calendly-style)

This is the main booking experience. Build a two-panel layout:

```
+---------------------------+---------------------------+
|                           |                           |
|   Select Doctor           |   Available Times         |
|   [Dr. Smith      v]     |                           |
|                           |   Monday, 09 Feb 2026     |
|   February 2026           |                           |
|   Mo Tu We Th Fr Sa Su    |   Morning                 |
|                  1        |   [09:00] [09:15] [09:30]  |
|    2  3  4  5  6  7  8    |   [09:45] [10:00] [10:15]  |
|   [9] 10 11 12 13 -- 15   |   [10:30] [10:45] [11:00]  |
|   16 17 18 19 20 21 22    |   [11:15] [11:30] [11:45]  |
|   23 24 25 26 27 28       |   [12:00] [12:15] [12:30]  |
|                           |   [12:45]                  |
|   -- = off day (greyed)   |                           |
|   [9] = selected date     |   Evening                 |
|   Bold = has slots        |   [16:00] [16:15] [16:30]  |
|                           |   [16:45] [17:00] [17:15]  |
|                           |   [17:30] [17:45] [18:00]  |
|                           |   [18:15] [18:30] [18:45]  |
+---------------------------+---------------------------+

              +-------------------------------+
              |  Book Appointment             |
              |  Name:    [_______________]   |
              |  Mobile:  [_______________]   |
              |  Gender:  [MALE    v]         |
              |  Source:  [PHONE   v]         |
              |                               |
              |  Dr. Smith | Mon 09 Feb       |
              |  09:00 - 09:15                |
              |                               |
              |  [  Confirm Booking  ]        |
              +-------------------------------+
```

#### Implementation Steps:

**Step 1: Doctor Selection**

- Call `GET /api/clinic/clinic-members` to get list of doctors.
- Let user select a doctor.

**Step 2: Calendar View**

- Call `GET /api/slots/available?doctor_id=<id>&start_date=<today>&end_date=<today+14>`.
- Parse the `days` array.
- On the calendar, **bold** the dates that have available slots.
- **Grey out** dates not in the response (no slots, off days, no working hours).
- Off days can be fetched separately: `GET /api/doctor-schedule/off-days?doctor_id=<id>` to show them distinctly on the calendar.

**Step 3: Time Slot Selection**

- When user clicks a date, show the `slots` array for that date.
- Group slots visually by time range (Morning: before 12:00, Afternoon: 12:00-16:00, Evening: after 16:00).
- Each slot is a clickable button showing `start_time` (e.g., "09:00").
- Highlight the selected slot.

**Step 4: Booking Form**

- After selecting a slot, show a form for patient details.
- On submit, call `POST /api/slots/book` with the selected slot and patient info.
- Handle the 409 CONFLICT error gracefully (show "This slot was just booked by someone else, please select another").

**Step 5: Confirmation**

- On success, show the appointment details from the response.
- Optionally redirect to the appointments list.

#### TypeScript Types

```typescript
// Working Hours
interface DoctorWorkingHour {
  id: string;
  doctor: DoctorShort;
  day_of_week: number;        // 0-6
  day_of_week_label: string;  // "Monday", etc.
  start_time: string;         // "09:00:00"
  end_time: string;           // "13:00:00"
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Off Day
interface DoctorOffDay {
  id: string;
  doctor: DoctorShort;
  date: string;               // "2026-02-14"
  reason: string | null;
  created_at: string;
  updated_at: string;
}

// Available Slots Response
interface AvailableSlotsResponse {
  doctor_id: string;
  start_date: string;
  end_date: string;
  days: DaySlots[];
}

interface DaySlots {
  date: string;               // "2026-02-09"
  day_of_week: string;        // "Monday"
  slots: AvailableSlot[];
}

interface AvailableSlot {
  start_time: string;         // "09:00:00"
  end_time: string;           // "09:15:00"
  status: "AVAILABLE";
}

// Book Slot Request
interface BookSlotRequest {
  doctor_id: string;
  date: string;               // "09-02-2026" (DD-MM-YYYY)
  start_time: string;         // "09:00" (HH:MM)
  name: string;
  mobile_number: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  source?: "PHONE" | "WHATSAPP" | "WALK_IN" | "WEBSITE" | "OTHER";
}

// Appointment Response (new shape)
interface Appointment {
  id: string;
  name: string;
  mobile_number: string;
  gender: string;
  doctor: DoctorShort;
  clinic_id: string;
  slot: AppointmentSlot | null;
  appointment_status: "WAITING" | "CHECKED_IN" | "NO_SHOW";
  source: string;
  created_at: string;
  updated_at: string;
}

interface AppointmentSlot {
  id: string;
  date: string;               // "2026-02-09"
  start_time: string;         // "09:00:00"
  end_time: string;           // "09:15:00"
  slot_status: "BOOKED" | "BLOCKED";
  created_at: string;
  updated_at: string;
}

interface DoctorShort {
  id: string;
  name: string;
  mobile_number: string;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

// Block Slot Request
interface BlockSlotRequest {
  doctor_id: string;
  date: string;               // "09-02-2026" (DD-MM-YYYY)
  start_time: string;         // "09:00" (HH:MM)
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
    meta: Record<string, any>;
  };
}
---

### Summary Checklist

- [ ] Create **Doctor Settings** page (Working Hours + Off Days)
- [ ] Build **Calendly-style slot picker** with calendar + time grid
- [ ] Replace old `POST /api/appointments` call with `POST /api/slots/book`
- [ ] Update appointment list/cards to read from `appointment.slot` instead of `appointment.appointment_date_time`
- [ ] Handle 409 CONFLICT errors on booking (slot taken by another user)
- [ ] Add **Block/Unblock slot** controls for admin/doctor view
- [ ] Update appointment detail view to show slot info
```
