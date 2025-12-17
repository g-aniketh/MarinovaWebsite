import { SubscriptionPlan, SubscriptionPlanConfig, FeatureLimits } from '../types';

// Subscription Plan Configurations
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  free: {
    name: 'free',
    displayName: 'Free Tier',
    price: 0,
    currency: 'USD',
    limits: {
      weatherBrief: 5,   // Universal credits
      researchLab: 5,    // Universal credits
      chat: 5,           // Universal credits
      insights: 5        // Universal credits
    }
  },
  retail_india: {
    name: 'retail_india',
    displayName: 'Retail India',
    price: 10,
    currency: 'USD',
    limits: {
      weatherBrief: 50,
      researchLab: 10,
      chat: 20,
      insights: -1  // Unlimited
    }
  },
  international: {
    name: 'international',
    displayName: 'International',
    price: 30,
    currency: 'USD',
    limits: {
      weatherBrief: -1,  // Unlimited
      researchLab: 50,
      chat: 100,
      insights: -1  // Unlimited
    }
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 50,
    currency: 'USD',
    limits: {
      weatherBrief: -1,  // Unlimited
      researchLab: 500,  // High limit for API-intensive
      chat: 500,         // High limit for API-intensive
      insights: -1       // Unlimited
    }
  }
};

// Helper function to get plan limits
export const getPlanLimits = (plan: SubscriptionPlan): FeatureLimits => {
  return SUBSCRIPTION_PLANS[plan].limits;
};

// Helper function to check if feature is unlimited
export const isFeatureUnlimited = (plan: SubscriptionPlan, feature: keyof FeatureLimits): boolean => {
  return SUBSCRIPTION_PLANS[plan].limits[feature] === -1;
};

// Helper function to get plan display name
export const getPlanDisplayName = (plan: SubscriptionPlan): string => {
  return SUBSCRIPTION_PLANS[plan].displayName;
};
