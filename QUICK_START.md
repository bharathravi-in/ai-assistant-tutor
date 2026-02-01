# Quick Start Guide - Phase 2 & 3 Features

## 🚀 Testing the New Features

### 1. Analytics Dashboard
**Access:** Login → Click "Analytics" in sidebar

**What to see:**
- Total queries, content created, chat messages, success rate
- Queries breakdown by mode (with progress bars)
- Top subjects you've queried about
- Reflection statistics (total, worked, not worked)
- Recent content table with views/likes/downloads

**Test:**
- Change period filter (7/30/90 days)
- Verify metrics update
- Check that your usage appears correctly

---

### 2. Notifications
**Access:** Bell icon in header (top right)

**What to see:**
- Red badge with unread count
- Dropdown showing latest notifications
- Each notification has:
  - Icon based on type
  - Title and message
  - Action button to navigate
  - Timestamp
  - Blue dot if unread

**Test:**
1. Have a CRP approve/reject your content
2. Bell should show notification
3. Click notification to mark as read
4. Click action button to navigate

---

### 3. Learning Library
**Access:** Click "Learning" in sidebar

**Modules Tab:**
- Grid of 6 learning modules
- Filter by category, difficulty, search
- "Featured only" toggle
- Each card shows:
  - Difficulty badge
  - Title and description
  - Duration and rating
  - Progress bar (if started)
  - Tags

**Module Detail:**
- Click any module card
- See full content with sections
- Update progress slider
- Rate with stars (1-5)
- Bookmark with star button
- "Mark as Complete" button

**Scenarios Tab:**
- Switch to scenarios view
- 4 classroom challenges
- Each shows:
  - Category badge
  - Situation preview
  - Helpful count
  - Application count

**Scenario Detail:**
- Click any scenario
- See situation and context
- Step-by-step solution framework
- Expert tips (green boxes)
- Common mistakes (orange boxes)
- "I Applied This" button
- "Mark as Helpful" button

---

### 4. Offline Mode
**Test:**
1. Disconnect from internet (turn off WiFi/unplug ethernet)
2. Orange indicator appears bottom-left: "You're offline"
3. Try to create content or update progress
4. Request is queued (shown in indicator)
5. Reconnect to internet
6. Blue indicator: "Back online! Syncing X items..."
7. Queued requests sync automatically

**Visual Feedback:**
- Orange box = offline
- Blue box = syncing
- Shows pending item count
- Disappears when all synced

---

### 5. RAG-Enhanced AI
**Access:** Ask AI → Submit a query

**What's different:**
- AI responses now include "Relevant Teaching Resources" section
- Shows up to 3 related resources from your content library
- Each resource shows:
  - Title
  - Description preview
  - Relevance score (%)
- Resources filtered by your grade/subject

**Test:**
1. Ask a question about a specific subject
2. Look for "Relevant Teaching Resources" in response
3. Resources should be related to your query

---

### 6. Sample Data

**Learning Modules (6):**
1. Active Learning Strategies
2. Classroom Management Fundamentals
3. Differentiated Instruction
4. Formative Assessment
5. Technology Integration
6. Engaging Low-Motivation Students

**Scenarios (4):**
1. Managing Disruptive Behavior
2. Homework Non-Completion
3. Low Participation
4. Mixed-Ability Classroom

---

## 🔧 For Admins/Developers

### Run Reflection Reminders
```bash
cd backend
python scripts/send_reflection_reminders.py
```

### Check Offline Queue
Open browser console:
```javascript
// Get queue status
offlineQueueService.getQueueStatus()

// Clear queue (if needed)
offlineQueueService.clearQueue()
```

### View API Documentation
http://localhost:8000/docs

### Check Vector Search
```python
# In backend/scripts/
python
>>> from app.services.vector_service import vector_service
>>> vector_service.is_available()
```

---

## 📊 Expected Behavior

### Content Approval Flow
1. Teacher creates content
2. Teacher submits for review
3. CRP approves/rejects
4. **Teacher receives notification** ✅
5. Notification shows in bell icon
6. Click to navigate to content

### Offline Scenario
1. User goes offline
2. Orange indicator appears
3. User continues working
4. Changes queued in IndexedDB
5. User comes back online
6. Blue "Back online!" indicator
7. All queued changes sync
8. Indicator disappears

### Learning Module Flow
1. Browse modules
2. Click to view detail
3. Read content sections
4. Update progress slider
5. Rate with stars
6. Bookmark if useful
7. Progress saves automatically

---

## ✅ Verification Checklist

- [ ] Analytics page loads with real data
- [ ] Notification bell shows unread count
- [ ] Learning library shows 6 modules
- [ ] Scenarios tab shows 4 scenarios
- [ ] Module detail page has progress slider
- [ ] Star rating works
- [ ] Bookmarks persist
- [ ] Offline indicator appears when disconnected
- [ ] Queued requests sync when reconnected
- [ ] AI responses include relevant resources
- [ ] Content approval sends notifications

---

## 🐛 Troubleshooting

### No Notifications Showing
- Check if content was actually approved/rejected
- Refresh the page
- Check browser console for errors

### Offline Queue Not Working
- Check browser console for IndexedDB errors
- Clear browser data and retry
- Ensure using modern browser (Chrome/Firefox/Edge)

### RAG Not Showing Resources
- Qdrant might not be configured
- Check backend logs for vector service errors
- RAG gracefully falls back - AI still works without it

### Learning Modules Not Loading
- Check network tab for API errors
- Verify backend is running
- Check `/api/learning/modules` endpoint in /docs

---

## 🎉 You're All Set!

All Phase 2 & 3 features are ready. Explore the analytics, browse learning modules, check notifications, and test offline mode!

For questions or issues, check the comprehensive documentation in `PHASE_2_3_COMPLETE.md`.
