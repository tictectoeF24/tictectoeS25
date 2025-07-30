require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");
const { sendWeeklyPopularPapersNewsletter } = require('./controllers/paperController');

// Set up a Supabase client for direct queries (for debugging)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugWeeklyPopularNewsletter() {
  console.log(' Testing Weekly Popular Papers Newsletter (with debug info)...\n');
  try {
    // 1. Fetch all users who are subscribed to the newsletter
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, name, username, subscribeNewsletter')
      .eq('subscribeNewsletter', true);

    if (usersError) {
      console.error(' Error fetching users:', usersError);
      return;
    }
    if (!users || users.length === 0) {
      console.log('  No users subscribed to the newsletter.');
      return;
    }
    console.log(`👥 Subscribed users (${users.length}):`);
    users.forEach(u => console.log(`   - ${u.email} (${u.name || u.username})`));

    // 2. Fetch the top 10 most popular papers from the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { data: papers, error: papersError } = await supabase
      .from('paper')
      .select('title, author_names, click_count, created_at, categories')
      .gte('created_at', oneWeekAgo.toISOString())
      .order('click_count', { ascending: false })
      .limit(10);

    if (papersError) {
      console.error(' Error fetching papers:', papersError);
      return;
    }
    if (!papers || papers.length === 0) {
      console.log('  No popular papers found for the past week.');
      return;
    }
    console.log(`\nTop 10 popular papers from the last week:`);
    papers.forEach((p, i) => {
      console.log(`   ${i+1}. "${p.title}" by ${p.author_names} (Clicks: ${p.click_count}, Category: ${p.categories}, Created: ${p.created_at})`);
    });

    // 3. Actually run the newsletter function
    console.log('\n Running sendWeeklyPopularPapersNewsletter()...\n');
    await sendWeeklyPopularPapersNewsletter();

    console.log('\n Weekly popular papers newsletter function executed!');
    console.log('   Check your email inbox and server logs for results.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

debugWeeklyPopularNewsletter();