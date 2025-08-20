import cron from 'node-cron';
import Device from '../models/Device.js';

// run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  const cutoff = new Date(Date.now() - 24*60*60*1000);
  try {
    const res = await Device.updateMany(
      { status: 'active', $or: [ { last_active_at: null }, { last_active_at: { $lt: cutoff } } ] },
      { $set: { status: 'inactive' } }
    );
    if (res.modifiedCount > 0) console.log(`[inactiveDeviceJob] Deactivated ${res.modifiedCount} devices`);
  } catch (err) { console.error('[inactiveDeviceJob]', err); }
});
