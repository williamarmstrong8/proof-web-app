# Updated Auth Flow with Pricing Integration

## Overview
The auth flow has been updated to include a pricing page after club creation. This provides a seamless onboarding experience for new users.

## Flow Steps

1. **Landing Page** → "Get Early Access" button
2. **Signup/Login** → User authentication
3. **Create Club** → Club setup and configuration
4. **Pricing Page** → Plan selection and subscription
5. **Admin Dashboard** → Full access to club management

## New Components

### Pricing Page (`src/admin-dashboard/pages/Pricing.tsx`)
- Modern, responsive design with 3 pricing tiers
- Monthly/Annual billing toggle with 17% savings
- Stripe checkout integration
- Success/error message handling
- Skip option for free trial

### Pricing Plans
- **Starter**: $15/month or $150/year
  - Up to 50 members
  - 5 events per month
  - Basic analytics
  - Email support

- **Growth**: $39/month or $390/year (Most Popular)
  - Up to 500 members
  - Unlimited events
  - AI DM Responder
  - Advanced analytics
  - Priority support

- **Enterprise**: $129/month or $1290/year
  - Unlimited members
  - Multi-club management
  - Advanced integrations
  - Dedicated support

## Environment Variables Required

Add these to your environment configuration:

```env
# Stripe Configuration (Vite environment variables)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_API_BASE_URL=http://localhost:3000

# Stripe Price IDs
VITE_PRICE_STARTER_MONTHLY=price_starter_monthly
VITE_PRICE_STARTER_YEARLY=price_starter_yearly
VITE_PRICE_GROWTH_MONTHLY=price_growth_monthly
VITE_PRICE_GROWTH_YEARLY=price_growth_yearly
VITE_PRICE_PRO_MONTHLY=price_pro_monthly
VITE_PRICE_PRO_YEARLY=price_pro_yearly
```

## Routes Updated

- `/choose-plan` - New pricing page for auth flow
- `/admin-home/pricing` - Pricing page within admin dashboard
- Updated `/create-club` to redirect to `/choose-plan`

## Stripe Integration

The pricing page integrates with the existing Stripe checkout API:
- Creates checkout sessions via `/api/create-checkout-session`
- Handles success/cancel redirects
- Stores subscription data in Supabase

## Features

- **Responsive Design**: Works on all device sizes
- **Modern UI**: Clean, professional design with gradients and animations
- **Error Handling**: Graceful error handling with user feedback
- **Skip Option**: Users can continue with free trial
- **Success Messages**: Clear feedback for payment status
- **Loading States**: Visual feedback during checkout process

## Testing

1. Start the development server: `npm run dev`
2. Navigate to the landing page
3. Click "Get Early Access"
4. Complete signup/login
5. Create a club
6. Verify pricing page appears
7. Test plan selection and billing toggle
8. Test skip functionality

## Future Enhancements

- Add more detailed plan comparisons
- Implement usage-based pricing
- Add promotional codes
- Enhanced analytics for conversion tracking
- A/B testing for different pricing displays
