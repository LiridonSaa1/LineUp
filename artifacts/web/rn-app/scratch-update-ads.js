const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cnlhqxegzphtlvtgijuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubGhxeGVnenBodGx2dGdpanVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTA2NDAsImV4cCI6MjA5Nzk4NjY0MH0.AiT2pha9udGDx7og-e7f9XJyHZUJJClIEj43YEyy-Pc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Upserting advertisements in Supabase...");
  
  const ads = [
    {
      business_name: "Vehees",
      url: "https://vehees.com/",
      image_url: "vehees_banner.jpg",
      status: "active",
      only_button: true
    },
    {
      business_name: "noasim",
      url: "https://noasim.com/guides",
      image_url: "noasim_banner.jpg",
      status: "active",
      only_button: true
    },
    {
      business_name: "NOA IPTV",
      url: "https://noaiptv.com",
      image_url: "noaiptv_banner.jpg",
      status: "active",
      only_button: true
    },
    {
      business_name: "Technova",
      url: "https://technova-ks.com",
      image_url: "technova_banner.jpg",
      status: "active",
      only_button: true
    }
  ];

  for (const ad of ads) {
    const { data, error } = await supabase
      .from('advertisements')
      .upsert(ad, { onConflict: 'business_name' });
      
    if (error) {
      console.error("Error upserting ad:", ad.business_name, error.message);
    } else {
      console.log("Successfully upserted ad:", ad.business_name);
    }
  }
}

run();
