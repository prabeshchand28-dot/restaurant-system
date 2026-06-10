const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const campaigns = await prisma.marketingCampaign.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(campaigns);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, channel, subject, message, targetGroup, scheduledAt } = req.body;
    if (!name || !message) return res.status(400).json({ message: 'name and message required' });
    const campaign = await prisma.marketingCampaign.create({
      data: { name, channel: channel || 'SMS', subject: subject || '', message, targetGroup: targetGroup || 'ALL', scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
    });
    res.json(campaign);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.send = async (req, res) => {
  try {
    const id = +req.params.id;
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status === 'SENT') return res.status(400).json({ message: 'Already sent' });

    // Determine recipients
    let customers = [];
    const profiles = await prisma.customerProfile.findMany({ select: { phone: true, email: true, totalVisits: true, totalSpend: true } });
    const loyaltyAccounts = await prisma.loyaltyAccount.findMany({ select: { phone: true, tier: true } });
    const tierMap = Object.fromEntries(loyaltyAccounts.map(l => [l.phone, l.tier]));

    if (campaign.targetGroup === 'ALL') {
      customers = profiles;
    } else if (campaign.targetGroup === 'VIP') {
      customers = profiles.filter(p => ['GOLD', 'PLATINUM'].includes(tierMap[p.phone]));
    } else if (campaign.targetGroup === 'LOYALTY') {
      customers = profiles.filter(p => tierMap[p.phone]);
    } else if (campaign.targetGroup === 'INACTIVE') {
      // Not visited in last 30 days — approximate by low visit count
      customers = profiles.filter(p => p.totalVisits < 3);
    }

    const sentCount = customers.length;

    // Log each simulated send
    if (sentCount > 0) {
      await prisma.notificationLog.createMany({
        data: customers.map(c => ({
          event: 'MARKETING_CAMPAIGN',
          channel: campaign.channel,
          recipient: campaign.channel === 'EMAIL' ? (c.email || c.phone) : c.phone,
          subject: campaign.subject,
          body: campaign.message,
          status: 'SENT'
        }))
      });
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id },
      data: { status: 'SENT', sentCount, sentAt: new Date() }
    });
    res.json({ success: true, campaign: updated, sentCount, message: `Campaign sent to ${sentCount} customers (simulated)` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getPreview = async (req, res) => {
  try {
    const { targetGroup } = req.query;
    const profiles = await prisma.customerProfile.findMany({ select: { phone: true, name: true, totalVisits: true } });
    const loyaltyAccounts = await prisma.loyaltyAccount.findMany({ select: { phone: true, tier: true } });
    const tierMap = Object.fromEntries(loyaltyAccounts.map(l => [l.phone, l.tier]));

    let audience = profiles;
    if (targetGroup === 'VIP') audience = profiles.filter(p => ['GOLD', 'PLATINUM'].includes(tierMap[p.phone]));
    else if (targetGroup === 'LOYALTY') audience = profiles.filter(p => tierMap[p.phone]);
    else if (targetGroup === 'INACTIVE') audience = profiles.filter(p => p.totalVisits < 3);

    res.json({ count: audience.length, sample: audience.slice(0, 5) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.marketingCampaign.delete({ where: { id: +req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const campaigns = await prisma.marketingCampaign.findMany();
    const total = campaigns.length;
    const sent  = campaigns.filter(c => c.status === 'SENT').length;
    const totalReach = campaigns.reduce((s, c) => s + c.sentCount, 0);
    res.json({ total, sent, drafts: total - sent, totalReach });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
