import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Initial subscription plans. The app reads plans from the DB at runtime —
 * this script only seeds the initial set. Prices are in the smallest unit
 * isn't applicable here (INR stored as whole rupees for display).
 */
const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    monthlyPrice: 0,
    currency: 'INR',
    includedMinutes: 300,
    displayOrder: 1,
    features: [
      '300 Communication Minutes / Month',
      'Unlimited Projects',
      'Unlimited Developers',
      'Hosted Meeting UI',
      'React UI Components',
      'Headless SDK',
      'REST API',
      'WebSocket Signaling',
      'Authentication',
      'Video Calling',
      'Audio Calling',
      'Screen Sharing',
      'Device Selection',
      'Developer Dashboard',
      'API Playground',
      'Documentation',
      'Community Support',
    ],
  },
  {
    name: 'Starter',
    slug: 'starter',
    monthlyPrice: 1999,
    currency: 'INR',
    includedMinutes: 2500,
    displayOrder: 2,
    features: [
      '2500 Communication Minutes',
      'Unlimited Projects',
      'Unlimited Developers',
      'Hosted Meeting UI',
      'React UI Components',
      'Headless SDK',
      'REST API',
      'WebSocket Signaling',
      'Authentication',
      'Video Calling',
      'Audio Calling',
      'Screen Sharing',
      'Device Selection',
      'Developer Dashboard',
      'API Playground',
      'Documentation',
      'Email Support',
      'Custom Branding',
      'Custom Logo',
      'Remove BlueJoinet Branding',
      'Higher API Rate Limits',
      'Production Usage',
      'Better TURN Priority',
    ],
  },
  {
    name: 'Growth',
    slug: 'growth',
    monthlyPrice: 6999,
    currency: 'INR',
    includedMinutes: 12000,
    displayOrder: 3,
    features: [
      '12000 Communication Minutes',
      'Unlimited Projects',
      'Unlimited Developers',
      'Hosted Meeting UI',
      'React UI Components',
      'Headless SDK',
      'REST API',
      'WebSocket Signaling',
      'Authentication',
      'Video Calling',
      'Audio Calling',
      'Screen Sharing',
      'Device Selection',
      'Developer Dashboard',
      'API Playground',
      'Documentation',
      'Priority Email Support',
      'Webhooks',
      'Call History',
      'Usage Dashboard',
      'Team Management',
      'API Keys Management',
      'Staging Environment',
      'Higher API Limits',
      'Faster TURN Allocation',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    monthlyPrice: 16999,
    currency: 'INR',
    includedMinutes: 35000,
    displayOrder: 4,
    features: [
      '35000 Communication Minutes',
      'Unlimited Projects',
      'Unlimited Developers',
      'Hosted Meeting UI',
      'React UI Components',
      'Headless SDK',
      'REST API',
      'WebSocket Signaling',
      'Authentication',
      'Video Calling',
      'Audio Calling',
      'Screen Sharing',
      'Device Selection',
      'Developer Dashboard',
      'API Playground',
      'Documentation',
      'Priority Technical Support',
      'SLA',
      'Dedicated Success Manager',
      'Advanced Monitoring',
      'Custom Domains',
      'Custom Hosted UI Branding',
      'Dedicated TURN Pool',
      'Highest API Limits',
      'Early Access Features',
    ],
  },
];

async function main() {
  for (const plan of PLANS) {
    const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
    if (existing) {
      await prisma.plan.update({
        where: { slug: plan.slug },
        data: {
          name: plan.name,
          monthlyPrice: plan.monthlyPrice,
          currency: plan.currency,
          includedMinutes: plan.includedMinutes,
          displayOrder: plan.displayOrder,
          features: plan.features as any,
          status: true,
        },
      });
      console.log(`Updated plan: ${plan.name}`);
    } else {
      await prisma.plan.create({
        data: {
          name: plan.name,
          slug: plan.slug,
          monthlyPrice: plan.monthlyPrice,
          currency: plan.currency,
          includedMinutes: plan.includedMinutes,
          displayOrder: plan.displayOrder,
          features: plan.features as any,
          status: true,
        },
      });
      console.log(`Created plan: ${plan.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
