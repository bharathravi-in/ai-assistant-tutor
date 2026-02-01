"""
Scheduled task to send reflection reminders
Run this with a cron job or task scheduler
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import async_session_maker
from app.models.reflection import Reflection
from app.models.user import User, UserRole
from app.routers.notifications import create_notification
from app.models.notification import NotificationType


async def send_reflection_reminders():
    """Send reminders to teachers who haven't reflected in 7 days"""
    async with async_session_maker() as db:
        try:
            # Get all active teachers
            result = await db.execute(
                select(User).where(
                    and_(
                        User.role == UserRole.TEACHER,
                        User.is_active == True
                    )
                )
            )
            teachers = result.scalars().all()
            
            reminders_sent = 0
            for teacher in teachers:
                # Check last reflection date
                last_reflection = await db.execute(
                    select(Reflection)
                    .where(Reflection.user_id == teacher.id)
                    .order_by(Reflection.created_at.desc())
                    .limit(1)
                )
                last = last_reflection.scalar_one_or_none()
                
                # Send reminder if no reflection in last 7 days
                should_remind = False
                if not last:
                    should_remind = True  # Never reflected
                elif (datetime.utcnow() - last.created_at).days >= 7:
                    should_remind = True  # Been 7+ days
                
                if should_remind:
                    await create_notification(
                        db=db,
                        user_id=teacher.id,
                        notification_type=NotificationType.REFLECTION_REMINDER,
                        title="Time for Reflection 📝",
                        message="It's been a while! Take a moment to reflect on your recent teaching experiences.",
                        action_url="/teacher/reflections",
                        action_label="Start Reflection"
                    )
                    reminders_sent += 1
                    print(f"✅ Sent reminder to {teacher.name}")
            
            print(f"\n✅ Sent {reminders_sent} reflection reminders")
            
        except Exception as e:
            print(f"❌ Error sending reminders: {e}")
            raise


if __name__ == "__main__":
    print("🔔 Checking for reflection reminders...\n")
    asyncio.run(send_reflection_reminders())
