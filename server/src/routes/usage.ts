import express, { Request, Response, Router } from 'express';
import User from '../models/User';
import authMiddleware from '../middleware/auth';
import { TrackUsageRequestBody, SubscribeRequestBody, SubscriptionPlan, FeatureName } from '../types';
import { SUBSCRIPTION_PLANS, getPlanLimits } from '../config/subscriptionPlans';

const router: Router = express.Router();

// Feature name mapping from UI strings to typed feature names
const FEATURE_MAP: Record<string, FeatureName> = {
  'weather': 'weatherBrief',
  'weatherBrief': 'weatherBrief',
  'research': 'researchLab',
  'researchLab': 'researchLab',
  'report': 'researchLab',
  'chat': 'chat',
  'insights': 'insights'
};

// Helper to check if monthly credits need reset
const shouldResetCredits = (resetDate: Date): boolean => {
  const now = new Date();
  const monthsSince = (now.getFullYear() - resetDate.getFullYear()) * 12 + 
                     (now.getMonth() - resetDate.getMonth());
  return monthsSince >= 1;
};

// @route   POST /api/usage/track
// @desc    Track feature usage and deduct credits
// @access  Private
router.post('/track', authMiddleware, async (req: Request<object, object, TrackUsageRequestBody>, res: Response): Promise<void> => {
  try {
    const { feature } = req.body;

    if (!feature) {
      res.status(400).json({
        success: false,
        message: 'Feature name is required'
      });
      return;
    }

    // Map feature name
    const featureName = FEATURE_MAP[feature];
    if (!featureName) {
      res.status(400).json({
        success: false,
        message: 'Invalid feature name'
      });
      return;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email to use this feature',
        requiresVerification: true
      });
      return;
    }

    // Check and reset monthly credits if needed (paid tiers only)
    if (user.subscriptionStatus !== 'free' && shouldResetCredits(user.creditResetDate)) {
      const planLimits = getPlanLimits(user.subscriptionStatus);
      user.monthlyCredits = {
        weatherBrief: planLimits.weatherBrief === -1 ? -1 : planLimits.weatherBrief,
        researchLab: planLimits.researchLab === -1 ? -1 : planLimits.researchLab,
        chat: planLimits.chat === -1 ? -1 : planLimits.chat,
        insights: planLimits.insights === -1 ? -1 : planLimits.insights
      };
      user.creditResetDate = new Date();
    }

    // FREE TIER LOGIC
    if (user.subscriptionStatus === 'free') {
      // Check universal credits
      if (user.usageCredits <= 0) {
        res.status(403).json({
          success: false,
          message: 'You have used all your free credits. Please subscribe to continue.',
          requiresSubscription: true,
          usageCredits: 0
        });
        return;
      }

      // Deduct one universal credit
      user.usageCredits -= 1;
    } 
    // PAID TIER LOGIC
    else {
      const currentCredit = user.monthlyCredits[featureName];
      
      // Check if unlimited (-1)
      if (currentCredit !== -1) {
        // Check if credits depleted
        if (currentCredit <= 0) {
          res.status(403).json({
            success: false,
            message: `You have used all your monthly ${featureName} credits. Please upgrade your plan or wait for next month.`,
            requiresUpgrade: true,
            featureCredits: user.monthlyCredits
          });
          return;
        }

        // Deduct feature-specific credit
        user.monthlyCredits[featureName] -= 1;
      }
      // If unlimited, no deduction needed
    }

    // Track usage
    user.usageHistory.push({
      feature: featureName,
      usedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Usage tracked',
      usageCredits: user.usageCredits,
      monthlyCredits: user.monthlyCredits,
      subscriptionStatus: user.subscriptionStatus
    });
  } catch (error) {
    console.error('Track usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/usage/credits
// @desc    Get remaining credits
// @access  Private
router.get('/credits', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      usageCredits: user.usageCredits,
      monthlyCredits: user.monthlyCredits,
      subscriptionStatus: user.subscriptionStatus,
      isEmailVerified: user.isEmailVerified,
      creditResetDate: user.creditResetDate,
      usageHistory: user.usageHistory
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/usage/subscribe
// @desc    Update subscription status and reset monthly credits
// @access  Private
router.put('/subscribe', authMiddleware, async (req: Request<object, object, SubscribeRequestBody>, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;

    const validPlans: SubscriptionPlan[] = ['free', 'retail_india', 'international', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
      return;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    user.subscriptionStatus = plan;

    // Set credits based on plan
    if (plan === 'free') {
      user.usageCredits = 5;
      user.monthlyCredits = {
        weatherBrief: 0,
        researchLab: 0,
        chat: 0,
        insights: 0
      };
    } else {
      const planLimits = getPlanLimits(plan);
      user.monthlyCredits = {
        weatherBrief: planLimits.weatherBrief,
        researchLab: planLimits.researchLab,
        chat: planLimits.chat,
        insights: planLimits.insights
      };
      user.creditResetDate = new Date();
    }

    await user.save();

    res.json({
      success: true,
      message: `Subscription updated to ${SUBSCRIPTION_PLANS[plan].displayName}`,
      subscriptionStatus: user.subscriptionStatus,
      usageCredits: user.usageCredits,
      monthlyCredits: user.monthlyCredits
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
