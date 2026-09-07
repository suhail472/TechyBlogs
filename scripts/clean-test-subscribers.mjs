import mongoose from 'mongoose';

async function clean() {
  await mongoose.connect('mongodb://localhost:27017/techyblogs');
  const res = await mongoose.connection.collection('subscribers').deleteMany({
    email: { $regex: 'test_' }
  });
  console.log('Cleaned test records:', res.deletedCount);
  process.exit(0);
}

clean().catch(console.error);
