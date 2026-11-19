# Portfolio Security Specification

## 1. Data Invariants
1. **Public Portfolio Read, Owner-Only Mutation**: Portfolio profile (`/portfolio/main`), `/projects`, `/experiences`, `/achievements`, `/skills`, and `/certifications` are publicly readable by recruiters and visitors, and strictly writable only by the verified owner (`ankurmishrastudent@gmail.com` with `email_verified == true` or listed in `/admins/{uid}`).
2. **PII Isolation on Inquiries**: `/inquiries/{inquiryId}` accepts public `create` operations from recruiters via the contact form, strictly enforcing `status == 'new'`, `createdAt == request.time`, valid email format, and bounded string lengths. `get`, `list`, `update`, and `delete` on `/inquiries` are restricted exclusively to the verified owner (`isAdmin()`).
3. **Path Hardening & Bounded Payloads**: All document IDs match `^[a-zA-Z0-9_-]+$` (`<= 128` chars), all strings enforce `size()` bounds, and all arrays (`tools <= 10`, `highlights <= 8`) enforce strict size caps and element type checks.
4. **Temporal & Key Integrity**: `createdAt` is immutable on update and forced to `request.time` on create; `updatedAt` is forced to `request.time` on create and update. Exact `keys().hasAll(...)` + `keys().hasOnly(...)` and `affectedKeys().hasOnly(...)` prevent shadow/ghost field injection.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on Project Create**: Adding `"isVerified": true` to `/projects/p1` -> Must return `PERMISSION_DENIED`.
2. **Unverified Email Admin Spoof**: Authenticated user with `email: "ankurmishrastudent@gmail.com"` and `email_verified: false` updating `/portfolio/main` -> Must return `PERMISSION_DENIED`.
3. **Recruiter PII Read Leak**: Unauthenticated or non-admin user calling `get` or `list` on `/inquiries` -> Must return `PERMISSION_DENIED`.
4. **Inquiry Status Forgery**: Visitor creating an inquiry with `status: "reviewed"` instead of `"new"` -> Must return `PERMISSION_DENIED`.
5. **Backdated Timestamp Spoofing**: Creating a project or inquiry with a forged past `createdAt` timestamp instead of `request.time` -> Must return `PERMISSION_DENIED`.
6. **Immutable `createdAt` Tampering**: Admin updating a project while altering `createdAt` -> Must return `PERMISSION_DENIED`.
7. **ID Poisoning**: Creating `/projects/invalid$id!with*badchars` or a 300-char ID -> Must return `PERMISSION_DENIED`.
8. **Unbounded Array Exhaustion**: Creating a project with 25 items in `tools` (`> 10`) or an experience with 15 `highlights` (`> 8`) -> Must return `PERMISSION_DENIED`.
9. **Value Type Poisoning**: Updating `project.order` to a string `"first"` or `project.featured` to `1` -> Must return `PERMISSION_DENIED`.
10. **Oversized String Exhaustion**: Submitting an inquiry `message` of 10,000 characters (`> 2000`) -> Must return `PERMISSION_DENIED`.
11. **Self-Assigned Admin Escalation**: Non-admin authenticated user writing `/admins/{theirUid}` with `role: "admin"` -> Must return `PERMISSION_DENIED`.
12. **Non-Owner Portfolio Deletion**: Authenticated non-owner visitor attempting `delete` on `/projects/p1` -> Must return `PERMISSION_DENIED`.
