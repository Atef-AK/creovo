"""
Stripe Billing Service

Handles subscriptions, payments, and billing for Lensio.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

import stripe

from lensio.core import settings


# Initialize Stripe
stripe.api_key = settings.stripe_api_key.get_secret_value()


class SubscriptionPlan(str, Enum):
    """Available subscription plans."""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    AGENCY = "agency"


# Stripe Price IDs (configure in Stripe Dashboard)
PRICE_IDS = {
    SubscriptionPlan.STARTER: {
        "monthly": "price_starter_monthly",
        "yearly": "price_starter_yearly",
    },
    SubscriptionPlan.PRO: {
        "monthly": "price_pro_monthly",
        "yearly": "price_pro_yearly",
    },
    SubscriptionPlan.AGENCY: {
        "monthly": "price_agency_monthly",
        "yearly": "price_agency_yearly",
    },
}

# Credits per plan
PLAN_CREDITS = {
    SubscriptionPlan.FREE: 5,
    SubscriptionPlan.STARTER: 30,
    SubscriptionPlan.PRO: 100,
    SubscriptionPlan.AGENCY: 500,
}


@dataclass
class CheckoutResult:
    """Result from checkout session creation."""
    success: bool
    session_id: str | None = None
    checkout_url: str | None = None
    error: str | None = None


@dataclass
class PortalResult:
    """Result from customer portal session."""
    success: bool
    portal_url: str | None = None
    error: str | None = None


@dataclass
class SubscriptionInfo:
    """Subscription information."""
    user_id: str
    stripe_customer_id: str
    stripe_subscription_id: str | None
    plan: SubscriptionPlan
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False


class StripeService:
    """
    Stripe billing integration.
    
    Handles:
    - Customer creation
    - Subscription checkout
    - Customer portal
    - Webhook processing
    - Credit purchases
    """
    
    def __init__(self):
        self.webhook_secret = settings.stripe_webhook_secret.get_secret_value()
    
    # =========================================================================
    # CUSTOMER MANAGEMENT
    # =========================================================================
    
    async def get_or_create_customer(
        self,
        user_id: str,
        email: str,
        name: str | None = None,
    ) -> str:
        """
        Get existing Stripe customer or create new one.
        
        Returns customer ID.
        """
        # Search for existing customer
        customers = stripe.Customer.search(
            query=f"metadata['user_id']:'{user_id}'",
        )
        
        if customers.data:
            return customers.data[0].id
        
        # Create new customer
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={
                "user_id": user_id,
            },
        )
        
        return customer.id
    
    # =========================================================================
    # CHECKOUT
    # =========================================================================
    
    async def create_checkout_session(
        self,
        user_id: str,
        email: str,
        plan: SubscriptionPlan,
        interval: str = "monthly",
        success_url: str = "",
        cancel_url: str = "",
    ) -> CheckoutResult:
        """
        Create Stripe Checkout session for subscription.
        
        Args:
            user_id: User's Lensio ID
            email: User's email
            plan: Subscription plan to purchase
            interval: 'monthly' or 'yearly'
            success_url: Redirect URL on success
            cancel_url: Redirect URL on cancel
        
        Returns:
            CheckoutResult with session URL
        """
        try:
            if plan == SubscriptionPlan.FREE:
                return CheckoutResult(
                    success=False,
                    error="Cannot checkout free plan",
                )
            
            # Get or create customer
            customer_id = await self.get_or_create_customer(user_id, email)
            
            # Get price ID
            price_id = PRICE_IDS.get(plan, {}).get(interval)
            if not price_id:
                return CheckoutResult(
                    success=False,
                    error=f"Invalid plan/interval: {plan}/{interval}",
                )
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode="subscription",
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1,
                }],
                success_url=success_url or f"{settings.allowed_origins[0]}/dashboard?checkout=success",
                cancel_url=cancel_url or f"{settings.allowed_origins[0]}/pricing?checkout=cancelled",
                subscription_data={
                    "metadata": {
                        "user_id": user_id,
                        "plan": plan.value,
                    },
                },
                metadata={
                    "user_id": user_id,
                    "plan": plan.value,
                },
            )
            
            return CheckoutResult(
                success=True,
                session_id=session.id,
                checkout_url=session.url,
            )
            
        except stripe.StripeError as e:
            return CheckoutResult(
                success=False,
                error=str(e),
            )
    
    async def create_credit_checkout(
        self,
        user_id: str,
        email: str,
        credits: int,
        success_url: str = "",
        cancel_url: str = "",
    ) -> CheckoutResult:
        """
        Create checkout session for one-time credit purchase.
        
        Args:
            user_id: User's ID
            email: User's email
            credits: Number of credits to purchase
        """
        try:
            customer_id = await self.get_or_create_customer(user_id, email)
            
            # Price per credit: $0.10
            unit_amount = 10  # cents
            
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode="payment",
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": unit_amount,
                        "product_data": {
                            "name": f"Lensio Credits ({credits})",
                            "description": f"{credits} video generation credits",
                        },
                    },
                    "quantity": credits,
                }],
                success_url=success_url or f"{settings.allowed_origins[0]}/dashboard?credits=success",
                cancel_url=cancel_url or f"{settings.allowed_origins[0]}/credits?checkout=cancelled",
                metadata={
                    "user_id": user_id,
                    "type": "credits",
                    "credits": str(credits),
                },
            )
            
            return CheckoutResult(
                success=True,
                session_id=session.id,
                checkout_url=session.url,
            )
            
        except stripe.StripeError as e:
            return CheckoutResult(success=False, error=str(e))
    
    # =========================================================================
    # CUSTOMER PORTAL
    # =========================================================================
    
    async def create_portal_session(
        self,
        user_id: str,
        return_url: str = "",
    ) -> PortalResult:
        """
        Create Stripe Customer Portal session.
        
        Allows customers to manage subscriptions, payment methods, etc.
        """
        try:
            # Find customer
            customers = stripe.Customer.search(
                query=f"metadata['user_id']:'{user_id}'",
            )
            
            if not customers.data:
                return PortalResult(
                    success=False,
                    error="Customer not found",
                )
            
            customer_id = customers.data[0].id
            
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url or f"{settings.allowed_origins[0]}/dashboard",
            )
            
            return PortalResult(
                success=True,
                portal_url=session.url,
            )
            
        except stripe.StripeError as e:
            return PortalResult(success=False, error=str(e))
    
    # =========================================================================
    # SUBSCRIPTION MANAGEMENT
    # =========================================================================
    
    async def get_subscription(self, user_id: str) -> SubscriptionInfo | None:
        """Get user's current subscription."""
        try:
            customers = stripe.Customer.search(
                query=f"metadata['user_id']:'{user_id}'",
            )
            
            if not customers.data:
                return None
            
            customer = customers.data[0]
            
            # Get active subscription
            subscriptions = stripe.Subscription.list(
                customer=customer.id,
                status="active",
                limit=1,
            )
            
            if not subscriptions.data:
                # Return free tier info
                return SubscriptionInfo(
                    user_id=user_id,
                    stripe_customer_id=customer.id,
                    stripe_subscription_id=None,
                    plan=SubscriptionPlan.FREE,
                    status="active",
                    current_period_start=datetime.utcnow(),
                    current_period_end=datetime.utcnow(),
                )
            
            sub = subscriptions.data[0]
            plan_value = sub.metadata.get("plan", "starter")
            
            return SubscriptionInfo(
                user_id=user_id,
                stripe_customer_id=customer.id,
                stripe_subscription_id=sub.id,
                plan=SubscriptionPlan(plan_value),
                status=sub.status,
                current_period_start=datetime.fromtimestamp(sub.current_period_start),
                current_period_end=datetime.fromtimestamp(sub.current_period_end),
                cancel_at_period_end=sub.cancel_at_period_end,
            )
            
        except Exception:
            return None
    
    async def cancel_subscription(
        self,
        user_id: str,
        immediately: bool = False,
    ) -> bool:
        """
        Cancel user's subscription.
        
        Args:
            user_id: User to cancel
            immediately: If True, cancel now. If False, cancel at period end.
        """
        try:
            info = await self.get_subscription(user_id)
            if not info or not info.stripe_subscription_id:
                return False
            
            if immediately:
                stripe.Subscription.delete(info.stripe_subscription_id)
            else:
                stripe.Subscription.modify(
                    info.stripe_subscription_id,
                    cancel_at_period_end=True,
                )
            
            return True
            
        except Exception:
            return False
    
    # =========================================================================
    # WEBHOOKS
    # =========================================================================
    
    def verify_webhook(
        self,
        payload: bytes,
        signature: str,
    ) -> dict[str, Any] | None:
        """
        Verify and parse Stripe webhook.
        
        Returns parsed event or None if invalid.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                self.webhook_secret,
            )
            return event
        except Exception:
            return None
    
    async def handle_webhook_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Handle Stripe webhook event.
        
        Returns action to take.
        """
        event_type = event.get("type", "")
        data = event.get("data", {}).get("object", {})
        
        handlers = {
            "checkout.session.completed": self._handle_checkout_completed,
            "customer.subscription.created": self._handle_subscription_created,
            "customer.subscription.updated": self._handle_subscription_updated,
            "customer.subscription.deleted": self._handle_subscription_deleted,
            "invoice.paid": self._handle_invoice_paid,
            "invoice.payment_failed": self._handle_payment_failed,
        }
        
        handler = handlers.get(event_type)
        if handler:
            return await handler(data)
        
        return {"action": "ignored", "type": event_type}
    
    async def _handle_checkout_completed(self, data: dict) -> dict:
        """Handle successful checkout."""
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        
        if metadata.get("type") == "credits":
            # Credit purchase
            credits = int(metadata.get("credits", 0))
            return {
                "action": "add_credits",
                "user_id": user_id,
                "credits": credits,
            }
        
        # Subscription checkout
        return {
            "action": "subscription_created",
            "user_id": user_id,
            "plan": metadata.get("plan"),
        }
    
    async def _handle_subscription_created(self, data: dict) -> dict:
        """Handle new subscription."""
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan = metadata.get("plan", "starter")
        
        return {
            "action": "activate_subscription",
            "user_id": user_id,
            "plan": plan,
            "credits": PLAN_CREDITS.get(SubscriptionPlan(plan), 0),
            "subscription_id": data.get("id"),
        }
    
    async def _handle_subscription_updated(self, data: dict) -> dict:
        """Handle subscription update (upgrade/downgrade)."""
        metadata = data.get("metadata", {})
        return {
            "action": "update_subscription",
            "user_id": metadata.get("user_id"),
            "plan": metadata.get("plan"),
            "status": data.get("status"),
        }
    
    async def _handle_subscription_deleted(self, data: dict) -> dict:
        """Handle subscription cancellation."""
        metadata = data.get("metadata", {})
        return {
            "action": "cancel_subscription",
            "user_id": metadata.get("user_id"),
        }
    
    async def _handle_invoice_paid(self, data: dict) -> dict:
        """Handle successful payment - grant credits."""
        customer_id = data.get("customer")
        
        # Find user
        customer = stripe.Customer.retrieve(customer_id)
        user_id = customer.metadata.get("user_id")
        
        # Get subscription to determine credits
        lines = data.get("lines", {}).get("data", [])
        plan = "starter"
        for line in lines:
            if line.get("type") == "subscription":
                plan = line.get("metadata", {}).get("plan", "starter")
                break
        
        return {
            "action": "grant_credits",
            "user_id": user_id,
            "credits": PLAN_CREDITS.get(SubscriptionPlan(plan), 0),
            "invoice_id": data.get("id"),
        }
    
    async def _handle_payment_failed(self, data: dict) -> dict:
        """Handle failed payment."""
        customer_id = data.get("customer")
        customer = stripe.Customer.retrieve(customer_id)
        
        return {
            "action": "payment_failed",
            "user_id": customer.metadata.get("user_id"),
            "invoice_id": data.get("id"),
        }


# Singleton
stripe_service = StripeService()
