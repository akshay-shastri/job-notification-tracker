
# Job Notification Tracker

A precision-matched job discovery system for Indian tech professionals. Stop missing the right jobs.

## 🔗 Live Demo
## 🔗 Live Demo

🚀 **Live App:**  
[View the Job Notification Tracker](https://akshay-shastri.github.io/job-notification-tracker/app.html)

## 📋 Overview

Job Notification Tracker is a sophisticated job search management system designed specifically for the Indian tech job market. It features intelligent match scoring, personalized daily digests, and comprehensive application tracking.

## ✨ Core Features

### 1. Intelligent Match Scoring
- Deterministic scoring algorithm (0-100%)
- Matches based on role keywords, location, mode, experience, and skills
- Color-coded badges: Green (80-100%), Amber (60-79%), Neutral (40-59%), Grey (<40%)
- Real-time score calculation for 60+ Indian tech jobs

### 2. Smart Filtering System
- Keyword search (title/company)
- Location filter (Bangalore, Hyderabad, Pune, Chennai, Mumbai, etc.)
- Work mode filter (Remote/Hybrid/Onsite)
- Experience level filter (Fresher/0-1/1-3/3-5 years)
- Job source filter (LinkedIn/Naukri/Indeed)
- Application status filter (Not Applied/Applied/Rejected/Selected)
- Multiple sort options (Latest, Match Score, Salary)
- "Show only matches" toggle for threshold filtering

### 3. Daily Digest Simulation
- Generates top 10 jobs by match score and recency
- Email-style clean layout
- Per-day persistence (localStorage)
- Copy to clipboard functionality
- Email draft creation with mailto:
- Recent status updates tracking

### 4. Application Status Tracking
- 4 status states per job (Not Applied/Applied/Rejected/Selected)
- Color-coded status badges
- Toast notifications on status change
- Status history tracking (last 20 changes)
- Persistent across page refreshes

### 5. Preference Management
- Role keywords (comma-separated)
- Preferred locations (multi-select)
- Work mode preferences (checkboxes)
- Experience level selection
- Skills matching (comma-separated)
- Minimum match score threshold (slider 0-100%)
- All preferences persist in localStorage

### 6. Job Management
- Save/unsave jobs
- View detailed job information (modal)
- Apply directly (opens in new tab)
- 60 realistic Indian tech jobs dataset
- Companies: Amazon, Flipkart, Swiggy, Razorpay, PhonePe, CRED, Zoho, TCS, Infosys, and more

### 7. Built-in Test Checklist
- 10 comprehensive test items
- Tooltip guidance for each test
- Progress tracking (X/10 passed)
- Ship lock enforcement (must pass all tests)
- Reset functionality

### 8. Final Proof & Submission System
- 8-step completion summary
- URL validation for deployment links
- Project status tracking (Not Started/In Progress/Shipped)
- Formatted submission export
- Ships only when all conditions met

## 🎨 Design System

Built on **KodNest Premium Build System**:
- Calm, intentional, coherent design
- Off-white background (#F7F6F3)
- Deep red accent (#8B0000)
- Crimson Pro (serif) for headings
- Inter (sans-serif) for body text
- Consistent 8px spacing scale
- No gradients, no glassmorphism, no animation noise
- Premium, professional aesthetic

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Styling:** Custom CSS with design system
- **Storage:** localStorage for persistence
- **Routing:** Hash-based SPA routing
- **Deployment:** GitHub Pages

## 📁 Project Structure

```
job-notification-tracker/
├── app.html              # Main HTML file
├── app.js                # Application logic & routing
├── app.css               # App-specific styles
├── design-system.css     # Design system foundation
├── jobs-data.js          # 60 realistic Indian tech jobs
└── README.md             # Documentation
```

## 🚀 Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/akshay-shastri/job-notification-tracker.git
cd job-notification-tracker
```

2. Open with Live Server (VS Code):
   - Install "Live Server" extension
   - Right-click `app.html` → "Open with Live Server"
   - Or simply open `app.html` in your browser

3. Navigate to: `http://127.0.0.1:5500/app.html`

### Usage

1. **Set Preferences** (Settings page)
   - Add role keywords: "Developer, Engineer, Intern"
   - Select preferred locations
   - Choose work modes
   - Set experience level
   - Add skills
   - Adjust match threshold

2. **Browse Jobs** (Dashboard)
   - View 60 Indian tech jobs
   - See match scores on each card
   - Apply filters to narrow results
   - Save interesting jobs
   - Update application status

3. **Generate Digest** (Digest page)
   - Click "Generate Today's 9AM Digest"
   - View top 10 matched jobs
   - Copy to clipboard or create email draft

4. **Track Progress** (Test page)
   - Complete 10 test checklist items
   - Verify all features work correctly

5. **Submit Proof** (Proof page)
   - Add deployment links
   - View completion summary
   - Copy final submission

## 📊 Data

Dataset includes 60 realistic Indian tech jobs:
- **Companies:** Amazon, Flipkart, Swiggy, Razorpay, PhonePe, Paytm, CRED, Zoho, Freshworks, TCS, Infosys, Wipro, Accenture, and more
- **Roles:** SDE Intern, Graduate Engineer Trainee, Junior Developer, Frontend/Backend Developer, QA Engineer, Data Analyst, etc.
- **Locations:** Bangalore, Hyderabad, Pune, Chennai, Mumbai, Noida, Gurgaon
- **Salary Ranges:** ₹15k-40k/month (internships), 3-5 LPA, 6-10 LPA, 10-18 LPA, 25-40 LPA

## 🧪 Testing

Complete the built-in test checklist:
- ✓ Preferences persist after refresh
- ✓ Match score calculates correctly
- ✓ "Show only matches" toggle works
- ✓ Save job persists after refresh
- ✓ Apply opens in new tab
- ✓ Status update persists after refresh
- ✓ Status filter works correctly
- ✓ Digest generates top 10 by score
- ✓ Digest persists for the day
- ✓ No console errors on main pages

## 🔒 Privacy

All data stored locally in browser's localStorage:
- `jobTrackerPreferences` - User preferences
- `jobTrackerStatus` - Job application statuses
- `jobTrackerStatusHistory` - Status change history
- `jobTrackerDigest_YYYY-MM-DD` - Daily digests
- `savedJobs` - Saved job IDs
- `jobTrackerTestChecklist` - Test completion status
- `jobTrackerProof` - Deployment links

No data sent to external servers. Everything runs client-side.

## 📱 Responsive Design

- Desktop-first design
- Mobile-friendly navigation (hamburger menu)
- Responsive filter bar
- Adaptive job cards
- Touch-friendly interactions

## 🎯 Match Scoring Algorithm

```
+25 points: Role keyword in job title
+15 points: Role keyword in job description
+15 points: Location match
+10 points: Work mode match
+10 points: Experience level match
+15 points: Skills overlap
+5 points: Posted within 2 days
+5 points: LinkedIn source
Maximum: 100 points
```

## 🤝 Contributing

This is a personal project built as part of a learning exercise. Feel free to fork and customize for your own use.

## 📄 License

MIT License - feel free to use this project for learning purposes.

## 👤 Author

**Akshay Shastri**
- GitHub: [@akshay-shastri](https://github.com/akshay-shastri)

## 🙏 Acknowledgments

- Design system inspired by KodNest Premium Build System
- Job data represents realistic Indian tech market scenarios
- Built with focus on calm, intentional design principles

---

**Live Demo:** [https://akshay-shastri.github.io/job-notification-tracker/app.html](https://akshay-shastri.github.io/job-notification-tracker/app.html)

**Status:** ✅ Shipped

