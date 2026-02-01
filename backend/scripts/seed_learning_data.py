"""
Seed sample learning modules and scenario templates
"""
import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models.learning import LearningModule, ScenarioTemplate, LearningModuleCategory, LearningModuleDifficulty

# Create engine and session
settings = get_settings()
DATABASE_URL = settings.database_url_sync
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Sample learning modules
SAMPLE_MODULES = [
    {
        "title": "Introduction to Active Learning Strategies",
        "description": "Learn how to engage students through participatory methods and hands-on activities",
        "category": LearningModuleCategory.PEDAGOGY,
        "difficulty": LearningModuleDifficulty.BEGINNER,
        "duration_minutes": 15,
        "content": {
            "sections": [
                {
                    "title": "What is Active Learning?",
                    "content": "Active learning is an instructional approach that engages students in the learning process. Instead of passively listening to lectures, students participate in activities that require them to think, discuss, and apply concepts."
                },
                {
                    "title": "Benefits of Active Learning",
                    "content": "Research shows that active learning improves retention, develops critical thinking skills, and increases student motivation. Students who participate actively perform better on assessments and develop deeper understanding."
                },
                {
                    "title": "Simple Active Learning Techniques",
                    "content": "Start with think-pair-share: Ask a question, give students time to think individually, then discuss with a partner, and finally share with the class. Other techniques include: quick polls, minute papers, group problem-solving, and peer teaching."
                }
            ]
        },
        "tags": ["active_learning", "engagement", "pedagogy", "beginner"],
        "keywords": "active learning, student engagement, participatory methods, think-pair-share",
        "prerequisites": [],
        "grades": ["6", "7", "8", "9", "10"],
        "subjects": ["all"],
        "is_featured": True
    },
    {
        "title": "Classroom Management Fundamentals",
        "description": "Essential strategies for creating a positive and productive learning environment",
        "category": LearningModuleCategory.CLASSROOM_MANAGEMENT,
        "difficulty": LearningModuleDifficulty.BEGINNER,
        "duration_minutes": 20,
        "content": {
            "sections": [
                {
                    "title": "Setting Clear Expectations",
                    "content": "Start the year by establishing clear rules and routines. Involve students in creating classroom agreements. Be consistent in enforcing rules and explaining the reasons behind them."
                },
                {
                    "title": "Positive Reinforcement",
                    "content": "Focus on recognizing positive behavior rather than only addressing negative behavior. Use specific praise, rewards, and acknowledgment to encourage desired behaviors."
                },
                {
                    "title": "Proactive Strategies",
                    "content": "Plan engaging lessons, arrange seating strategically, establish routines for transitions, and build relationships with students. Prevention is more effective than reaction."
                }
            ]
        },
        "tags": ["classroom_management", "discipline", "routines", "behavior"],
        "keywords": "classroom management, discipline, behavior, rules, routines",
        "prerequisites": [],
        "grades": ["6", "7", "8", "9", "10"],
        "subjects": ["all"],
        "is_featured": True
    },
    {
        "title": "Differentiated Instruction Basics",
        "description": "Learn to adapt teaching methods to meet diverse student needs",
        "category": LearningModuleCategory.DIFFERENTIATION,
        "difficulty": LearningModuleDifficulty.INTERMEDIATE,
        "duration_minutes": 25,
        "content": {
            "sections": [
                {
                    "title": "Understanding Differentiation",
                    "content": "Differentiated instruction means modifying teaching based on student readiness, interests, and learning profiles. It's about providing multiple paths to learning the same content."
                },
                {
                    "title": "Differentiating Content, Process, and Product",
                    "content": "Content: What students learn. Process: How students learn. Product: How students demonstrate learning. You can differentiate any of these based on student needs."
                },
                {
                    "title": "Practical Strategies",
                    "content": "Use flexible grouping, tiered assignments, learning stations, choice boards, and varied assessment methods. Start small with one strategy and gradually incorporate more."
                }
            ]
        },
        "tags": ["differentiation", "inclusive", "diverse_learners", "adaptation"],
        "keywords": "differentiation, diverse learners, adaptation, tiered assignments",
        "prerequisites": [],
        "grades": ["6", "7", "8", "9", "10"],
        "subjects": ["all"],
        "is_featured": True
    },
    {
        "title": "Formative Assessment Strategies",
        "description": "Techniques for checking understanding and adjusting instruction",
        "category": LearningModuleCategory.ASSESSMENT,
        "difficulty": LearningModuleDifficulty.INTERMEDIATE,
        "duration_minutes": 20,
        "content": {
            "sections": [
                {
                    "title": "What is Formative Assessment?",
                    "content": "Formative assessment is ongoing feedback during learning to improve student understanding. Unlike summative tests, formative assessments guide instruction in real-time."
                },
                {
                    "title": "Quick Check Techniques",
                    "content": "Exit tickets, thumbs up/down, quick quizzes, whiteboard responses, think-pair-share. These take 1-5 minutes and provide immediate feedback."
                },
                {
                    "title": "Using Data to Adjust Teaching",
                    "content": "Analyze formative assessment results to identify misconceptions. Reteach difficult concepts, provide extra support, or move forward based on student readiness."
                }
            ]
        },
        "tags": ["assessment", "formative", "feedback", "data"],
        "keywords": "formative assessment, exit tickets, feedback, checking understanding",
        "prerequisites": [],
        "grades": ["6", "7", "8", "9", "10"],
        "subjects": ["all"],
        "is_featured": False
    },
    {
        "title": "Technology Integration in Teaching",
        "description": "Effective ways to use digital tools to enhance learning",
        "category": LearningModuleCategory.TECHNOLOGY_INTEGRATION,
        "difficulty": LearningModuleDifficulty.BEGINNER,
        "duration_minutes": 18,
        "content": {
            "sections": [
                {
                    "title": "Purpose-Driven Technology Use",
                    "content": "Technology should enhance learning, not replace good teaching. Ask: Does this tool help students learn better? Choose technology that aligns with learning objectives."
                },
                {
                    "title": "Simple Digital Tools",
                    "content": "Start with accessible tools: educational videos, digital quizzes, collaboration platforms. Many free tools can make lessons more interactive without requiring advanced skills."
                },
                {
                    "title": "Managing Technology in Classroom",
                    "content": "Establish clear rules for device use. Have a backup plan if technology fails. Teach digital citizenship alongside technology use."
                }
            ]
        },
        "tags": ["technology", "digital_tools", "edtech", "innovation"],
        "keywords": "technology integration, digital tools, edtech, online learning",
        "prerequisites": [],
        "grades": ["6", "7", "8", "9", "10"],
        "subjects": ["all"],
        "is_featured": False
    },
    {
        "title": "Engaging Low-Motivation Students",
        "description": "Strategies to motivate and engage reluctant learners",
        "category": LearningModuleCategory.STUDENT_ENGAGEMENT,
        "difficulty": LearningModuleDifficulty.INTERMEDIATE,
        "duration_minutes": 22,
        "content": {
            "sections": [
                {
                    "title": "Understanding Motivation",
                    "content": "Low motivation often stems from lack of relevance, fear of failure, or unmet needs. Identify the root cause before choosing strategies."
                },
                {
                    "title": "Building Relationships",
                    "content": "Connect with students personally. Show interest in their lives. Build trust. Students work harder for teachers who care about them."
                },
                {
                    "title": "Making Learning Relevant",
                    "content": "Connect content to students' lives and interests. Provide choices in assignments. Use real-world examples. Celebrate small successes."
                }
            ]
        },
        "tags": ["motivation", "engagement", "reluctant_learners", "relationships"],
        "keywords": "student motivation, engagement, reluctant learners, building relationships",
        "prerequisites": [],
        "grades": ["6", "7", "8", "9", "10"],
        "subjects": ["all"],
        "is_featured": True
    }
]

# Sample scenario templates
SAMPLE_SCENARIOS = [
    {
        "title": "Managing Disruptive Behavior During Lessons",
        "description": "Effective strategies for handling students who disrupt class",
        "category": "student_behavior",
        "situation": "A student repeatedly talks out of turn, distracts others, and refuses to follow instructions during your lesson. Other students are losing focus and the class is falling behind schedule.",
        "context": "The student is academically capable but seeks attention through negative behavior. Previous verbal warnings have had minimal effect.",
        "solution_framework": {
            "steps": [
                {
                    "title": "Immediate Response",
                    "description": "Use non-verbal cues first: eye contact, proximity, or a gesture. If behavior continues, speak privately without disrupting the entire class."
                },
                {
                    "title": "Private Conversation",
                    "description": "Talk to the student after class. Ask about reasons for behavior. Listen empathetically. Explain impact on learning and set clear expectations."
                },
                {
                    "title": "Create a Behavior Plan",
                    "description": "Work with student to create goals. Offer positive reinforcement for appropriate behavior. Implement logical consequences for continued disruption."
                },
                {
                    "title": "Follow Up",
                    "description": "Monitor behavior daily. Provide specific feedback. Celebrate improvements. Involve parents if behavior doesn't improve."
                }
            ],
            "key_points": [
                "Stay calm and avoid power struggles",
                "Focus on the behavior, not the student personally",
                "Be consistent with consequences",
                "Build a positive relationship outside of conflict moments"
            ]
        },
        "expert_tips": [
            "Position yourself near the student during lessons to minimize disruptions",
            "Provide opportunities for the student to have positive attention",
            "Consider if there are underlying issues (learning difficulties, home problems) affecting behavior",
            "Document incidents to show patterns and progress"
        ],
        "common_mistakes": [
            "Engaging in arguments in front of the class",
            "Inconsistent enforcement of rules",
            "Making threats you can't or won't follow through on",
            "Taking the behavior personally"
        ],
        "is_featured": True
    },
    {
        "title": "Students Not Completing Homework",
        "description": "Addressing chronic homework non-completion issues",
        "category": "classroom_management",
        "situation": "More than half the class regularly comes without homework completed. Students offer various excuses or don't acknowledge the assignment at all.",
        "context": "Homework is essential for practice and reinforcement, but compliance is very low. You've tried reminders and consequences but see little improvement.",
        "solution_framework": {
            "steps": [
                {
                    "title": "Assess the Root Cause",
                    "description": "Survey students anonymously about barriers: too difficult, too much time, lack of resources, not understanding purpose. Different causes need different solutions."
                },
                {
                    "title": "Redesign Homework Approach",
                    "description": "Make homework purposeful and manageable. Provide time in class to start. Offer choices when possible. Ensure students understand how to complete it."
                },
                {
                    "title": "Establish Clear Systems",
                    "description": "Create a homework routine: check at start of class, provide feedback, allow time to ask questions. Make expectations crystal clear."
                },
                {
                    "title": "Positive Reinforcement",
                    "description": "Recognize students who complete work. Create incentives for improvement. Focus on progress, not perfection."
                }
            ],
            "key_points": [
                "Quality matters more than quantity",
                "Homework should reinforce, not introduce new concepts",
                "Consider home situations and access to resources",
                "Communicate importance to parents"
            ]
        },
        "expert_tips": [
            "Start small - reduce homework load temporarily and build completion habits",
            "Provide 10 minutes at end of class for students to start homework",
            "Use a homework tracking system students can see (chart, board)",
            "Connect with families about supporting homework completion"
        ],
        "common_mistakes": [
            "Assigning homework without checking if students can do it independently",
            "Making homework too difficult or time-consuming",
            "Not following up or providing feedback on completed homework",
            "Using homework as punishment"
        ],
        "is_featured": True
    },
    {
        "title": "Low Student Participation in Class",
        "description": "Strategies to encourage shy or reluctant students to participate",
        "category": "engagement",
        "situation": "Most students remain silent during class discussions. Only 2-3 students regularly raise hands. Others appear disengaged or afraid to speak up.",
        "context": "Active participation is needed for learning and assessment. Current approach of calling on volunteers isn't working for majority of students.",
        "solution_framework": {
            "steps": [
                {
                    "title": "Create a Safe Environment",
                    "description": "Establish norms that all ideas are valued. Never ridicule wrong answers. Model making mistakes as part of learning."
                },
                {
                    "title": "Use Varied Participation Structures",
                    "description": "Think-pair-share, small group discussions, written responses, digital polls. Not all participation needs to be whole-class verbal."
                },
                {
                    "title": "Provide Wait Time",
                    "description": "After asking a question, wait 5-10 seconds before calling on anyone. This gives all students time to think."
                },
                {
                    "title": "Build Confidence Gradually",
                    "description": "Start with low-risk participation. Use turn-and-talk. Cold call with supportive questions. Celebrate all contributions."
                }
            ],
            "key_points": [
                "Not all students are comfortable with public speaking",
                "Introverted students may participate better in writing or small groups",
                "Build relationships so students feel safe taking risks",
                "Validate attempts, not just correct answers"
            ]
        },
        "expert_tips": [
            "Use random selection (popsicle sticks with names) so all students prepare to answer",
            "Allow students to 'phone a friend' if they don't know an answer",
            "Start class with a quick pair-share so everyone talks before whole-class discussion",
            "Notice and appreciate non-verbal participation (nodding, note-taking)"
        ],
        "common_mistakes": [
            "Always calling on the same students",
            "Moving too quickly to the answer without wait time",
            "Making students feel bad for incorrect responses",
            "Equating silence with not learning"
        ],
        "is_featured": True
    },
    {
        "title": "Differentiating for Mixed-Ability Classroom",
        "description": "Teaching effectively when students have very different skill levels",
        "category": "differentiation",
        "situation": "Your class has students with widely varying abilities. Some finish work in 10 minutes while others struggle to start. Whole-class instruction frustrates both advanced and struggling learners.",
        "context": "You need to challenge advanced students while supporting struggling ones, all in the same lesson.",
        "solution_framework": {
            "steps": [
                {
                    "title": "Pre-Assess Student Levels",
                    "description": "Use quick assessments to identify what students already know. Group students by readiness level for specific skills."
                },
                {
                    "title": "Plan Tiered Activities",
                    "description": "Create 2-3 versions of the same activity at different difficulty levels. All focus on the same learning objective but with different complexity."
                },
                {
                    "title": "Use Flexible Grouping",
                    "description": "Sometimes group by ability, sometimes mix levels. Change groupings based on the skill being taught."
                },
                {
                    "title": "Provide Choice",
                    "description": "Offer options for how students demonstrate learning. Create menus or choice boards with required and optional activities."
                }
            ],
            "key_points": [
                "Start with one subject/unit rather than differentiating everything",
                "All students should feel challenged but not overwhelmed",
                "Differentiation doesn't mean totally different lessons",
                "Core concepts stay same, depth and support vary"
            ]
        },
        "expert_tips": [
            "Keep a bank of extension activities for students who finish early",
            "Teach students to self-assess and choose appropriate challenge level",
            "Use learning stations where students rotate through different tasks",
            "Have struggling students explain concepts to build their confidence"
        ],
        "common_mistakes": [
            "Always grouping the same students together",
            "Making different work obvious (causing stigma)",
            "Only helping struggling students while advanced ones are bored",
            "Expecting perfection - start small and improve gradually"
        ],
        "is_featured": False
    }
]


def seed_learning_data():
    """Seed sample learning modules and scenarios"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_modules = db.query(LearningModule).count()
        if existing_modules > 0:
            print(f"✓ Learning modules already exist ({existing_modules} found). Skipping...")
            return
        
        # Create modules
        print("Creating learning modules...")
        for module_data in SAMPLE_MODULES:
            module = LearningModule(**module_data)
            db.add(module)
        
        db.commit()
        print(f"✓ Created {len(SAMPLE_MODULES)} learning modules")
        
        # Create scenarios
        print("Creating scenario templates...")
        for scenario_data in SAMPLE_SCENARIOS:
            scenario = ScenarioTemplate(**scenario_data)
            db.add(scenario)
        
        db.commit()
        print(f"✓ Created {len(SAMPLE_SCENARIOS)} scenario templates")
        
        print("\n✅ Successfully seeded learning library data!")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding Learning Library Data...\n")
    seed_learning_data()
