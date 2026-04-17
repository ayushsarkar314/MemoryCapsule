const mongoose = require('mongoose');
require('dotenv').config();

async function checkCapsules() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Capsule = require('./src/models/Capsule');
    const capsules = await Capsule.find({ 'rules.destroyAfterView': true }).limit(5);
    console.log('Capsules with destroyAfterView:');
    capsules.forEach(c => {
      console.log(`ID: ${c._id}, status: ${c.status}, destroyAt: ${c.destroyAt}, seenByRecipient: ${c.seenByRecipient}, rules: ${JSON.stringify(c.rules)}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkCapsules();