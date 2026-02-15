// supabase/functions/apply-scheduled-downgrades/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing env vars" }),
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { error } = await supabase.rpc("apply_scheduled_downgrades")

  if (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500 }
    )
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200 }
  )
})