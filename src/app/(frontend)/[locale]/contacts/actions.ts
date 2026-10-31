'use server'

/**
 * Stub lead action for stage 1. Real persistence (leads collection) + Telegram
 * notification land in later stages; here it only acknowledges the submission
 * so the form can show its success state.
 */
export type LeadResult = { ok: true }

export async function submitPartQuestion(_input: {
  car: string
  what: string
  phone: string
  photoCount: number
}): Promise<LeadResult> {
  // TODO(stage 5/6): create a `leads` record and notify Telegram.
  return { ok: true }
}
