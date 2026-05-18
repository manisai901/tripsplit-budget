# Security Specification - Mani Traveler

## Data Invariants
1. A trip must have an owner who is the first member.
2. Expenses, checklist items, and settlements must belong to a valid trip.
3. Only members of a trip can read or write data within that trip's subcollections.
4. `createdAt` fields are immutable.
5. All IDs must be strictly valid.

## The Dirty Dozen (Logic Leaks)
1. **Unauthenticated Write**: Creating a trip without being logged in.
2. **Owner Hijack**: Updating `ownerId` to yourself on a trip you don't own.
3. **Data Poisoning**: Setting `amount` to -1,000,000.
4. **ID Poisoning**: Using a 2KB string as a `tripId`.
5. **PII Leak**: Accessing another user's email/profile without being in the same trip.
6. **Immutability Breach**: Changing the `createdAt` timestamp after creation.
7. **Identity Spoofing**: Creating an expense with `payerId` as someone else's UID.
8. **Role Escalation**: Changing your own role from `viewer` to `owner`.
9. **Orphaned Writes**: Creating an expense for a trip that doesn't exist.
10. **Query Scraping**: Listing all expenses of all trips using a blanket list query.
11. **Negative Settlement**: Sending a settlement for a negative amount.
12. **Future Dates**: Setting `date` to a year 3000.

## Test Runner (Conceptual)
All "Dirty Dozen" payloads must return `PERMISSION_DENIED`.
