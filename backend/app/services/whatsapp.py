"""
WhatsApp Integration Service
Provides messaging functionality via WhatsApp Business API

NOTE: This is a stub implementation. To enable WhatsApp messaging:
1. Sign up for WhatsApp Business API (via Meta or Twilio)
2. Add credentials to environment variables:
   - WHATSAPP_API_URL
   - WHATSAPP_API_TOKEN
   - WHATSAPP_PHONE_NUMBER_ID
3. Uncomment the actual API calls below
"""
import os
import httpx
from typing import Optional, List
from app.config import get_settings

settings = get_settings()


class WhatsAppService:
    """
    WhatsApp Business API integration for sending notifications.
    """
    
    def __init__(self):
        self.api_url = os.getenv('WHATSAPP_API_URL', '')
        self.api_token = os.getenv('WHATSAPP_API_TOKEN', '')
        self.phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID', '')
        self.enabled = bool(self.api_url and self.api_token)
    
    async def send_message(
        self,
        to_phone: str,
        message: str,
        template_name: Optional[str] = None
    ) -> dict:
        """
        Send a WhatsApp message to a phone number.
        
        Args:
            to_phone: Recipient's phone number (with country code)
            message: Message text
            template_name: Optional pre-approved template name
        
        Returns:
            dict with success status and message_id
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "WhatsApp integration not configured",
                "message": "Add WHATSAPP_API_URL and WHATSAPP_API_TOKEN to environment"
            }
        
        # Normalize phone number
        phone = to_phone.replace('+', '').replace(' ', '').replace('-', '')
        if not phone.startswith('91'):
            phone = '91' + phone  # Add India country code
        
        try:
            # Actual API call (uncomment when configured)
            # async with httpx.AsyncClient() as client:
            #     response = await client.post(
            #         f"{self.api_url}/{self.phone_number_id}/messages",
            #         headers={
            #             "Authorization": f"Bearer {self.api_token}",
            #             "Content-Type": "application/json"
            #         },
            #         json={
            #             "messaging_product": "whatsapp",
            #             "to": phone,
            #             "type": "text",
            #             "text": {"body": message}
            #         }
            #     )
            #     if response.status_code == 200:
            #         return {"success": True, "message_id": response.json().get("messages", [{}])[0].get("id")}
            
            # Stub response for development
            return {
                "success": True,
                "message_id": f"stub_{phone}_{hash(message) % 10000}",
                "note": "WhatsApp integration in development mode"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def send_template_message(
        self,
        to_phone: str,
        template_name: str,
        template_params: List[str] = None
    ) -> dict:
        """
        Send a pre-approved template message.
        Templates must be approved by Meta before use.
        
        Common templates for Gov-Tech:
        - urgent_alert: For high-priority teacher alerts
        - training_reminder: Training session notifications
        - mentor_feedback: CRP feedback notifications
        """
        if not self.enabled:
            return {"success": False, "error": "WhatsApp not configured"}
        
        # Stub response
        return {
            "success": True,
            "template": template_name,
            "params": template_params or [],
            "note": "Template message queued (development mode)"
        }
    
    async def send_alert_to_crp(
        self,
        crp_phone: str,
        teacher_name: str,
        alert_type: str,
        message: str
    ) -> dict:
        """
        Send a teacher alert notification to CRP.
        """
        formatted_message = f"""
🚨 *Teacher Alert*

*Teacher:* {teacher_name}
*Type:* {alert_type}

{message}

Please check the Gov-Tech dashboard for details.
        """.strip()
        
        return await self.send_message(crp_phone, formatted_message)
    
    async def send_training_reminder(
        self,
        teacher_phone: str,
        training_title: str,
        date: str,
        time: str
    ) -> dict:
        """
        Send training reminder to a teacher.
        """
        message = f"""
📚 *Training Reminder*

*Title:* {training_title}
*Date:* {date}
*Time:* {time}

Don't forget to attend! Reply with any questions.
        """.strip()
        
        return await self.send_message(teacher_phone, message)


# Singleton instance
_whatsapp_service: Optional[WhatsAppService] = None


def get_whatsapp_service() -> WhatsAppService:
    """Get or create WhatsApp service instance."""
    global _whatsapp_service
    if _whatsapp_service is None:
        _whatsapp_service = WhatsAppService()
    return _whatsapp_service
