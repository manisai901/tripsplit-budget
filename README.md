# JourneyTracker

A real-time, multi-user trip management application built with React, Tailwind CSS, and Firebase.

## How it works

JourneyTracker allows users and their friends to plan trips together, track expenses in real-time, and make sure that trip spending is fair and balanced. 

### 1. Create and Join Trips
- A user logs in across devices safely and securely using Google Authentication.
- A user creates a "Trip" setting up a **Locality** and a Max Spend **Budget**.
- Once a trip is created, the user can easily share a unique **Secret Trip ID** with friends.
- Friends use this exact ID in the dashboard to instantly "Sync with Group" and join the active trip.

### 2. Transaction Records (Expense Tracking)
- Every transaction spent on the journey can be tracked.
- Just click "+ Add Record" and note down down how much was paid, by whom, at what time, and what category (e.g., Breakfast, Train, Stay). 
- All data synchronizes immediately to every member viewing the trip.

### 3. Settlement Parity
- No more awkward math at the end of the trip!
- The app features a live parity calculator. It computes the "Total Expedition Fund" and automatically determines how much each team member has paid relative to their equal "Share".
- A live balance (e.g. +$50.00 if you paid more, -$25.00 if you owe money) ensures team settlement is quick and easy.

### 4. Mission Objectives (Checklist)
- Users can build an itinerary or "Mission Objectives" checklist.
- Tasks can include a specific **Time** so everyone knows when and what is planned.
- Check off the list as missions are completed.

## Development

Built inside of Google AI Studio powered by Gemini. 

- **Tech Stack:** React, Tailwind CSS
- **Database:** Firebase Cloud Firestore
- **Authentication:** Firebase Auth (Google Provider)
