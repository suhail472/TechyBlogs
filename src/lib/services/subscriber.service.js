import Subscriber from '../models/subscriber.model.js';

class SubscriberService {
  async subscribe(email) {
    if (!email) throw new Error('Email is required');
    const cleanEmail = email.toLowerCase().trim();
    
    const existing = await Subscriber.findOne({ email: cleanEmail });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        await existing.save();
        return { message: 'Re-subscribed successfully', data: existing };
      }
      return { message: 'Already subscribed', data: existing };
    }

    const newSub = await Subscriber.create({ email: cleanEmail });
    return { message: 'Subscribed successfully', data: newSub };
  }

  async getAllSubscribers(filters = {}) {
    const { page = 1, limit = 20, search = '' } = filters;
    const query = { active: true };
    
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Subscriber.countDocuments(query),
    ]);

    return {
      subscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async unsubscribe(email) {
    if (!email) throw new Error('Email is required');
    const cleanEmail = email.toLowerCase().trim();

    const sub = await Subscriber.findOne({ email: cleanEmail });
    if (!sub) throw new Error('Email subscription not found');

    sub.active = false;
    await sub.save();
    return { message: 'Unsubscribed successfully' };
  }

  async deleteSubscriber(id) {
    const sub = await Subscriber.findById(id);
    if (!sub) throw new Error('Subscriber not found');
    await sub.deleteOne();
    return { message: 'Subscriber deleted successfully' };
  }
}

const subscriberService = new SubscriberService();
export default subscriberService;
