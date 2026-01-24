const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const supabase = require('./backend/src/config/supabase');

async function checkPlanSchema() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}

checkPlanSchema();
