# JPTL Property Management Platform — Entity Relationship Diagram (ERD)

This document contains the Entity Relationship Diagram (ERD) and Schema Specifications for all 14 Mongoose models in `apps/server/src/shared/models`.

---

## 1. Visual Entity Relationship Diagram

![JPTL Entity Relationship Diagram](./erd.svg)

> **Tip**: You can also open **[erd.html](./erd.html)** in any browser for an interactive canvas with pan & zoom.

<details>
<summary>Click to view raw Mermaid source code</summary>

```mermaid
erDiagram
    USER ||--o{ USER : "manages"
    USER ||--o{ PROPERTY : "owns"
    USER ||--o| TENANT_PROFILE : "profile"
    USER ||--o{ LEASE : "contract"
    USER ||--o{ PAYMENT : "pays"
    USER ||--o{ TICKET : "reports"
    USER ||--o{ DOCUMENT : "uploads"
    USER ||--o{ ANNOUNCEMENT : "broadcasts"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "acts"
    USER ||--o{ SESSION_LOG : "sessions"
    USER ||--o{ PUSH_SUBSCRIPTION : "devices"

    PROPERTY ||--o{ UNIT : "contains"
    PROPERTY ||--o{ LEASE : "hosts"
    PROPERTY ||--o{ PAYMENT : "billed"

    UNIT ||--o| USER : "tenant"
    UNIT ||--o{ LEASE : "leased"
    UNIT ||--o{ PAYMENT : "rent"
    UNIT ||--o{ TICKET : "repairs"
    UNIT ||--o{ DOCUMENT : "docs"

    LEASE ||--o{ EXTENSION_REQUEST : "extensions"
    TICKET ||--o{ TICKET_STATUS_HISTORY : "history"

    USER {
        ObjectId _id PK
        string firstName
        string middleName
        string lastName
        string email UK
        string phone
        string password
        string role
        string plan
        boolean onboardingCompleted
        ObjectId landlord FK
        string status
        string avatarUrl
        date createdAt
    }

    PROPERTY {
        ObjectId _id PK
        string name
        string address
        string city
        number unitsCount
        number occupancyRate
        string category
        boolean featured
        ObjectId landlord FK
        date createdAt
    }

    UNIT {
        ObjectId _id PK
        string label
        ObjectId property FK
        ObjectId tenant FK
        number monthlyRent
        boolean hasParking
        string parkingSpot
        number parkingFee
        number bedrooms
        number bathrooms
        number sqft
        string status
        date leaseStart
        date leaseEnd
    }

    TENANT_PROFILE {
        ObjectId _id PK
        ObjectId user FK
        ObjectId property FK
        ObjectId unit FK
        number monthlyRent
        boolean hasParking
        string parkingSpot
        number parkingFee
        date leaseStart
        date leaseEnd
        string status
        boolean autoPayEnabled
        number securityDeposit
    }

    LEASE {
        ObjectId _id PK
        ObjectId tenant FK
        ObjectId landlord FK
        ObjectId property FK
        ObjectId unit FK
        date leaseStart
        date leaseEnd
        number monthlyRent
        boolean hasParking
        string parkingSpot
        number parkingFee
        number securityDeposit
        string status
        string contractPdfUrl
    }

    EXTENSION_REQUEST {
        ObjectId _id PK
        number termMonths
        date proposedStartDate
        date proposedEndDate
        number monthlyRent
        string tenantNotes
        string status
        string landlordNotes
        date requestedAt
        date reviewedAt
        ObjectId reviewedBy FK
    }

    PAYMENT {
        ObjectId _id PK
        ObjectId tenant FK
        ObjectId unit FK
        ObjectId property FK
        number amount
        date dueDate
        string status
        string period
        string paymentMethod
        number baseRent
        number parkingFee
        number utilityFee
        boolean isAdvancePayment
        number advanceMonthsAhead
        date paidAt
    }

    TICKET {
        ObjectId _id PK
        string title
        string description
        string category
        string priority
        string status
        ObjectId unit FK
        ObjectId tenant FK
    }

    TICKET_STATUS_HISTORY {
        string status
        ObjectId changedBy FK
        string userRole
        string note
        date timestamp
    }

    DOCUMENT {
        ObjectId _id PK
        ObjectId tenant FK
        ObjectId unit FK
        string name
        string type
        string category
        string size
        string fileUrl
        string status
        string rejectionReason
        ObjectId reviewedBy FK
        date verifiedAt
    }

    ANNOUNCEMENT {
        ObjectId _id PK
        string title
        string content
        string category
        boolean isPinned
        ObjectId author FK
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId user FK
        string title
        string body
        string type
        boolean read
        string refModel
        ObjectId refId
    }

    AUDIT_LOG {
        ObjectId _id PK
        ObjectId actor FK
        string actorRole
        string action
        string entityKind
        ObjectId entityId
        string ipAddress
    }

    SESSION_LOG {
        ObjectId _id PK
        ObjectId userId FK
        string email
        string role
        string ip
        string userAgent
        date loginAt
        date logoutAt
        boolean isActive
    }

    PUSH_SUBSCRIPTION {
        ObjectId _id PK
        ObjectId user FK
        string endpoint
    }

    SYSTEM_SETTING {
        ObjectId _id PK
        string key UK
        mixed value
    }
```
</details>

---

## 2. Model Dictionary

### 1. `User` (`user.model.js`)
* **Collection:** `users`
* **Purpose:** Core identity model supporting multi-role authentication (Tenant, Landlord, Superadmin).
* **Key Fields:**
  * `email` (String, unique): Primary login identifier.
  * `role` (Enum): `'tenant'`, `'landlord'`, `'superadmin'`.
  * `landlord` (ObjectId -> User): Self-referencing link establishing tenant-landlord association.
  * `plan` (Enum): `'starter'`, `'pro'`, `'enterprise'`.
  * `status` (Enum): `'active'`, `'suspended'`.

### 2. `Property` (`property.model.js`)
* **Collection:** `properties`
* **Purpose:** Real estate developments or buildings owned by a landlord.
* **Key Fields:**
  * `landlord` (ObjectId -> User, required): The owning landlord.
  * `name`, `address`, `city` (Strings): Physical details.
  * `category` (Enum): `'Luxury'`, `'Studio'`, `'Penthouse'`, `'Residential'`, `'Commercial'`.
  * `accessCodes` (Object): Embedded Wi-Fi and gate passcodes.

### 3. `Unit` (`unit.model.js`)
* **Collection:** `units`
* **Purpose:** Individual rentable units within a property.
* **Key Fields:**
  * `property` (ObjectId -> Property, required).
  * `tenant` (ObjectId -> User, nullable): Active occupying tenant.
  * `status` (Enum): `'occupied'`, `'vacant'`, `'maintenance'`.
  * `monthlyRent`, `parkingFee`, `sqft` (Numbers).
  * `leaseStart`, `leaseEnd` (Dates).

### 4. `TenantProfile` (`tenantProfile.model.js`)
* **Collection:** `tenantprofiles`
* **Purpose:** Extended tenant state, payment methods, vehicle registrations, and lease terms.
* **Key Fields:**
  * `user` (ObjectId -> User, unique).
  * `property`, `unit` (ObjectIds, nullable).
  * `vehicles` (Array of subdocuments): `{ model, plate }`.
  * `paymentMethods` (Array of subdocuments): Tokenized credit cards and ACH profiles.

### 5. `Lease` (`lease.model.js`)
* **Collection:** `leases`
* **Purpose:** Formal lease contractual terms, covenants, and extension negotiation lifecycle.
* **Key Fields:**
  * `tenant`, `landlord`, `property`, `unit` (ObjectIds).
  * `leaseStart`, `leaseEnd` (Dates).
  * `status` (Enum): `'active'`, `'renewal_pending'`, `'renewal_approved'`, `'renewal_rejected'`, `'ended'`.
  * `extensionRequests` (Array of subdocuments): Extension duration, requested rent, dates, approval status, and reviewer notes.

### 6. `Payment` (`payment.model.js`)
* **Collection:** `payments`
* **Purpose:** Rent invoices, utility billings, and advance payment transactions.
* **Key Fields:**
  * `tenant`, `unit`, `property` (ObjectIds).
  * `amount`, `dueDate`, `paidAt`.
  * `status` (Enum): `'pending'`, `'paid'`, `'overdue'`, `'failed'`.
  * `isAdvancePayment` (Boolean), `advanceMonthsAhead` (Number).

### 7. `Ticket` (`ticket.model.js`)
* **Collection:** `tickets`
* **Purpose:** Tenant maintenance requests with dispatch workflow.
* **Key Fields:**
  * `tenant`, `unit` (ObjectIds).
  * `category` (Enum): `'HVAC'`, `'Plumbing'`, `'Electrical'`, `'Appliance'`, `'General'`, `'Structural'`, `'Pest'`, `'Other'`.
  * `priority` (Enum): `'low'`, `'medium'`, `'high'`, `'emergency'`.
  * `status` (Enum): `'submitted'`, `'acknowledged'`, `'in_progress'`, `'resolved'`, `'rejected'`, `'closed'`, `'cancelled'`.
  * `assignedTechnician` (Embedded Object).
  * `statusHistory` (Array of subdocuments).

### 8. `Document` (`document.model.js`)
* **Collection:** `documents`
* **Purpose:** File uploads for identity verification and signed leases.
* **Key Fields:**
  * `tenant`, `unit` (ObjectIds).
  * `category` (Enum): `'lease'`, `'upload'`, `'receipt'`.
  * `status` (Enum): `'Pending Review'`, `'Verified'`, `'Rejected'`.
  * `reviewedBy` (ObjectId -> User, nullable).

### 9. `Announcement` (`announcements.model.js`)
* **Collection:** `announcements`
* **Purpose:** Broadcast notices published by landlords or admins.
* **Key Fields:**
  * `author` (ObjectId -> User).
  * `category` (Enum): `'System'`, `'Maintenance'`, `'Policy'`, `'General'`.
  * `isPinned` (Boolean).

### 10. `Notification` (`notification.model.js`)
* **Collection:** `notifications`
* **Purpose:** In-app alert records dispatched to specific users.
* **Key Fields:**
  * `user` (ObjectId -> User).
  * `type` (Enum): `'maintenance'`, `'announcement'`, `'payment'`, `'lease'`, `'system'`.
  * `refModel` / `refId`: Polymorphic reference to source document.

### 11. `AuditLog` (`auditLog.model.js`)
* **Collection:** `auditlogs`
* **Purpose:** System-wide compliance and security audit trails.
* **Key Fields:**
  * `actor` (ObjectId -> User), `actorRole`, `action`.
  * `entityKind` (Enum), `entityId` (ObjectId).
  * `ipAddress`.

### 12. `SessionLog` (`sessionLog.model.js`)
* **Collection:** `sessionlogs`
* **Purpose:** User authentication sessions and live monitor.
* **Key Fields:**
  * `userId` (ObjectId -> User), `email`, `role`, `ip`, `userAgent`.
  * `loginAt`, `logoutAt`, `isActive`.

### 13. `PushSubscription` (`pushSubscription.model.js`)
* **Collection:** `pushsubscriptions`
* **Purpose:** Web Push API browser subscription tokens per device.

### 14. `SystemSetting` (`systemSetting.model.js`)
* **Collection:** `systemsettings`
* **Purpose:** Dynamic system key-value storage (maintenance mode, platform flags).
