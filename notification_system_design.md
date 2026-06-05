# Stage 1: Notification System Design Specifications

This document outlines the REST API architecture, data contracts, and real-time delivery mechanisms designed for the notification subsystem. This blueprint serves as the integration contract between front-end consumer applications and the backend notification microservice infrastructure.

---

## 1. Core Platform Actions
To deliver a seamless, state-synchronized user notification experience, the platform natively supports five core functional actions:

1. **Fetch Notifications:** Allows client apps to retrieve a paginated list of historical or current notifications tailored to the logged-in user.
2. **Mark as Read:** Enables mutating individual notification states from unread to read when viewed or interacted with.
3. **Mark All as Read:** A bulk-mutation shortcut to clear all unread badges for the user instantly.
4. **Delete Notification:** Soft-deletes a notification resource from the user’s inbox view.
5. **Fetch Preferences & Unread Count:** Provides real-time unread badges counts and channel routing preferences (Email, SMS, Push).

---

## 2. REST API Endpoint Design & JSON Schemas

### Global Headers
All HTTP REST API endpoints require the following standard headers for tracking, verification, and context passing:

| Header Key | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `Authorization` | String | Bearer JWT token verifying identity | `Bearer eyJhbGciOiJIUzI1Ni...` |
| `Content-Type` | String | Expresses payload data contract format | `application/json` |
| `X-Correlation-ID` | String | Unique UUID injected via Logging Middleware to trace requests | `c3b073b3-85b2-4d1b-8f3e-51829390234a` |

---

### Endpoints Contract Matrix

#### A. Fetch Authenticated User Notifications
* **Endpoint:** `GET /api/v1/notifications`
* **Query Parameters:** * `page` (Integer, default: 1)
  * `limit` (Integer, default: 20)
  * `status` (String, choices: `READ`, `UNREAD`, `ALL`, default: `ALL`)

* **Response Payload (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "data": {
    "notifications": [
      {
        "id": "ntf_892341",
        "recipientId": "usr_77210",
        "category": "MAINTENANCE_ALERT",
        "priority": "HIGH",
        "title": "Vehicle Overdue Alert",
        "body": "Vehicle VIN 1234XT has bypassed its 5000-mile safety check threshold.",
        "isRead": false,
        "metadata": {
          "vehicleId": "veh_00921",
          "triggerValue": "5230 mi"
        },
        "createdAt": "2026-06-05T10:13:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 87,
      "hasNextPage": true
    }
  }
}