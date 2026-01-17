# ROLE-BASED PRODUCT REQUIREMENTS DOCUMENT (PRD)
## AI Teaching & Classroom Coaching Platform (SaaS, Web-Based)

---

## 1. Role & Sector Matrix

| Role | Government Sector | Private Sector |
|------|-------------------|----------------|
| Teacher | Govt school teacher | Private school teacher |
| CRP | Cluster Resource Person | Instructional Coach / Academic Lead |
| ARP | Academic Resource Person | Subject Expert / Curriculum Lead |
| Admin | Block / District / State Admin | School / Chain / Org Admin |
| SuperAdmin | ❌ | ✅ Application Owner |

---

## 2. TEACHER PRD

### 2.1 Teacher – Government Sector

**Role Purpose**: Enable teachers to solve real-time classroom problems, improve pedagogy, and reduce dependency on infrequent physical mentoring.

**Key Problems**:
- No just-in-time help
- Multi-grade, mixed-ability classrooms
- Language barriers
- High accountability, low support

#### Features

**A. AI Tutor – Explain / Teach Mode**
- Ask in local language (voice/text)
- AI explains:
  - What to say to students
  - How to write on board
  - Common misconceptions
  - One diagnostic question
- Govt-specific:
  - Low-TLM explanations
  - Local analogies
  - Multi-grade adaptation

**B. AI Classroom Assistant – Real-Time Help**
- Immediate advice for:
  - Conceptual confusion
  - Noise / disengagement
  - Fast finishers
- Structured response:
  - What to do in next 5 minutes
  - Teaching pivot
  - Classroom management move
  - Fallback option

**C. Lesson Planner**
- 30–45 min lesson plans
- Multi-grade support
- No dependency on printed material

**D. Multilingual & Voice Support**
- Voice-first interaction
- AI responds in same language
- Hindi + state language configurable

**E. Reflection & Feedback**
- Tried? (Yes/No)
- Worked? (Yes/No)
- Voice reflection (30–60 sec)

**Govt Teacher KPIs**:
- Reduced fallback to rote
- Increased classroom experimentation
- Faster problem resolution

### 2.2 Teacher – Private Sector

**Differences from Govt**:
- More subject depth
- Better infrastructure
- Outcome-driven (scores, engagement)

**Additional Features**:
- Differentiated instruction strategies
- Bloom's taxonomy–aligned questioning
- Parent communication support (optional)
- Homework / assessment suggestions

---

## 3. CRP PRD
*(Govt: CRP | Private: Instructional Coach)*

### 3.1 CRP – Government Sector

**Role Purpose**: Provide asynchronous, scalable coaching without physical school visits.

#### Features

**A. Teacher Query Dashboard**
- Live & historical queries
- Filters: Grade, Subject, Issue type, Urgency

**B. Asynchronous Coaching**
- Voice reply (preferred)
- Short text suggestions
- Attach proven strategies

**C. Best Practice Tagging**
- Mark responses as: Effective / Needs improvement
- Promote to shared strategy pool

**D. Oversight & Mentoring**
- See teacher reflection outcomes
- Identify struggling teachers
- Plan targeted visits

**Govt CRP KPIs**:
- Coaching reach per month
- Effectiveness of advice
- Reduction in repeated issues

### 3.2 CRP – Private Sector (Instructional Coach)

**Additional capabilities**:
- School-wise benchmarking
- Teacher performance trends
- Coaching notes per teacher
- Training module recommendations

---

## 4. ARP PRD
*(Govt: ARP | Private: Subject Expert / Curriculum Lead)*

### 4.1 ARP – Government Sector

**Role Purpose**: Ensure academic quality, curriculum alignment, and pedagogy consistency across clusters.

#### Features

**A. Pattern & Trend Analysis**
- Recurring concept gaps
- Subject-wise difficulty areas
- Grade-wise heatmaps

**B. Content & Strategy Review**
- Review AI-generated explanations
- Approve / refine strategies
- Flag misalignment with curriculum

**C. Training Feedback Loop**
- Map training topics → classroom issues
- Identify training failures
- Recommend training redesign

**Govt ARP KPIs**:
- Reduction in repeated conceptual issues
- Improved training relevance
- Alignment with curriculum standards

### 4.2 ARP – Private Sector

**Additional features**:
- Curriculum mapping tools
- Assessment blueprint alignment
- Content versioning
- School-chain-wide standards enforcement

---

## 5. ADMIN PRD
*(Govt: Block/District/State | Private: School / Chain Admin)*

### 5.1 Admin – Government Sector

**Role Purpose**: Monitor system-level impact, ensure accountability, and guide policy decisions.

#### Features

**A. System Dashboards**
- Usage metrics
- Query-to-resolution time
- Adoption by district/block

**B. Classroom Challenges Heatmap**
- Grade × Subject × Region
- Seasonal trends
- Multi-grade hotspots

**C. Coaching Effectiveness Reports**
- % advice marked "Worked"
- CRP engagement metrics
- School-level comparisons

**D. Governance & Compliance**
- Role-based access
- Audit logs
- Data residency controls

**Govt Admin KPIs**:
- Improved teacher engagement
- Training ROI
- Reduction in learning gaps

### 5.2 Admin – Private Sector

**Additional features**:
- School performance analytics
- Teacher productivity dashboards
- Subscription & license management
- Outcome-based reporting

---

## 6. SUPERADMIN PRD (Application Owner)

**Role Purpose**: Operate, secure, and scale the SaaS platform across multiple government & private tenants.

#### Features

**A. Tenant Management**
- Govt state / district tenants
- Private org tenants
- Isolated data per tenant

**B. Role & Permission Control**
- Create / modify roles
- Custom permissions per tenant

**C. AI Governance**
- Prompt versioning
- Model switching
- Safety & bias controls
- Response auditing

**D. System Health & Ops**
- Usage monitoring
- Cost controls
- SLA tracking
- Incident management

**E. Billing & Licensing (Private Only)**
- Subscription plans
- Usage-based pricing
- Invoice management

---

## 7. Feature Availability Summary

| Role | Govt | Private |
|------|------|---------|
| AI Tutor | ✅ | ✅ |
| Classroom Assist | ✅ | ✅ |
| Lesson Planner | ✅ | ✅ |
| Reflection Loop | ✅ | ✅ |
| CRP Coaching | ✅ | ⚠️ (Coach-based) |
| Advanced Analytics | ⚠️ | ✅ |
| Billing | ❌ | ✅ |
| Tenant Control | ⚠️ | ✅ |
| AI Governance | ✅ | ✅ |

---

## 8. Design Principle (Non-Negotiable)

> **Government version** optimizes for scale, equity, and support.
> **Private version** optimizes for outcomes, performance, and differentiation.

**Same core platform. Different configuration, permissions, and emphasis.**
