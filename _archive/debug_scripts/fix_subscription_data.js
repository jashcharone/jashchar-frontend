const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const supabase = require('./backend/src/config/supabase');

async function fixSubscriptionData() {
  console.log('Fixing Subscription Data for School 2b729d32-3d03-470c-9283-48d67146f42b...');

  const schoolId = '2b729d32-3d03-470c-9283-48d67146f42b';
  const correctSubscriptionId = '5bf71539-5862-4cb4-87b5-5a4eae43e8bf';
  const badSubscriptionIds = [
    'a08f212c-88c0-488e-9832-40fe14fe4638',
    '05b0c690-7e85-4cb3-bdb8-1237472909d5'
  ];

  // 1. Reactivate the correct subscription
  const { error: updateError } = await supabase
    .from('school_subscriptions')
    .update({ status: 'active' })
    .eq('id', correctSubscriptionId);

  if (updateError) {
    console.error('Error reactivating subscription:', updateError);
  } else {
    console.log(`✅ Reactivated subscription ${correctSubscriptionId}`);
  }

  // 2. Mark bad subscriptions as cancelled
  for (const id of badSubscriptionIds) {
    const { error: cancelError } = await supabase
      .from('school_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (cancelError) {
      console.error(`Error cancelling subscription ${id}:`, cancelError);
    } else {
      console.log(`✅ Cancelled bad subscription ${id}`);
    }
  }

  console.log('Done.');
}

fixSubscriptionData();
