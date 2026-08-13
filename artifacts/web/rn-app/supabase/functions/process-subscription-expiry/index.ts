import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    console.log("Running daily subscription check...")

    // 1. Fetch all active subscriptions
    const { data: activeSubs, error } = await supabase
      .from('subscriptions')
      .select('*, barbershops(id, name, owner_id)')
      .eq('status', 'active')

    if (error) throw error

    const now = new Date()
    const results = { expired: 0, remindersSent: 0 }

    for (const sub of activeSubs) {
      const endDate = new Date(sub.current_period_end || sub.subscription_end_date)
      const diffTime = endDate.getTime() - now.getTime()
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // 2. Check for expiry
      if (daysRemaining <= 0) {
        console.log(`Expiring subscription ${sub.subscription_id} for shop ${sub.barbershops?.name}`)
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', sub.id)

        await supabase
          .from('barbershops')
          .update({ status: 'suspended' })
          .eq('id', sub.business_id)

        // Send Push Notification
        await sendNotification(sub.barbershops?.owner_id, "Abonimi ka Skaduar", `Plani juaj te LineUp ka skaduar. Rinovojeni për të vazhduar punën.`)
        results.expired++
      }
      // 3. Send reminders (7, 3, 1 days before)
      else if ([7, 3, 1].includes(daysRemaining)) {
        console.log(`Sending ${daysRemaining}-day reminder for ${sub.barbershops?.name}`)
        await sendNotification(
          sub.barbershops?.owner_id,
          "Kujtesë Abonimi",
          `Abonimi juaj skadon pas ${daysRemaining} ditësh. Sigurohuni të keni fonde të mjaftueshme për rinovim.`
        )
        results.remindersSent++
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Cron job error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
})

async function sendNotification(userId: string, title: string, message: string) {
  if (!userId) return;
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title,
      message,
      created_at: new Date().toISOString()
    })
  } catch (e) {
    console.warn("Failed to insert notification:", e)
  }
}
