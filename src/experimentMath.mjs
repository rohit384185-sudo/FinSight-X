
// FINSIGHT EXPERIMENT RESULTS BATCH 10
// Descriptive scenario math, not actual A/B-test evidence.
export function evaluateScenario(raw) {
  const fields = [
    'controlN','controlYes','treatmentN','treatmentYes',
    'controlBad','treatmentBad','guardrailLimit'
  ]
  const v = {}
  for (const field of fields) {
    const value = Number(raw[field])
    if (!Number.isFinite(value) || value < 0) {
      return {error:'All fields require valid nonnegative numbers.'}
    }
    v[field] = value
  }

  for (const field of fields.filter(x=>x!=='guardrailLimit')) {
    if (!Number.isInteger(v[field])) {
      return {error:'Group counts must be whole numbers.'}
    }
  }
  if (!Number.isInteger(v.controlN) ||
      !Number.isInteger(v.treatmentN) ||
      v.controlN < 1 || v.treatmentN < 1) {
    return {error:'Each group needs at least one customer.'}
  }
  if (v.controlN > 1000000 || v.treatmentN > 1000000) {
    return {error:'Maximum illustrative group size is 1,000,000.'}
  }
  if (v.controlYes > v.controlN ||
      v.treatmentYes > v.treatmentN ||
      v.controlBad > v.controlN ||
      v.treatmentBad > v.treatmentN) {
    return {error:'Conversions and adverse counts cannot exceed group size.'}
  }
  if (v.guardrailLimit > 100) {
    return {error:'Guardrail tolerance must be 0 to 100 percentage points.'}
  }

  const p1 = v.controlYes/v.controlN
  const p2 = v.treatmentYes/v.treatmentN
  const difference = p2-p1
  const variance =
    p1*(1-p1)/v.controlN + p2*(1-p2)/v.treatmentN
  const se = Math.sqrt(variance)
  const lower = (difference-1.96*se)*100
  const upper = (difference+1.96*se)*100

  const expectedCounts = [
    v.controlYes, v.controlN-v.controlYes,
    v.treatmentYes, v.treatmentN-v.treatmentYes
  ]
  const adequate =
    v.controlN>=30 && v.treatmentN>=30 &&
    expectedCounts.every(n=>n>=5)

  const bad1 = 100*v.controlBad/v.controlN
  const bad2 = 100*v.treatmentBad/v.treatmentN
  const badDelta = bad2-bad1
  const guardrailPass = badDelta <= v.guardrailLimit

  return {
    controlRate:p1*100,
    treatmentRate:p2*100,
    upliftPP:difference*100,
    relativeUplift:p1>0 ? difference/p1*100 : null,
    lower,upper,
    adequate,
    signal:adequate && (lower>0 || upper<0),
    guardrailPass,
    controlBadRate:bad1,
    treatmentBadRate:bad2,
    badDelta,
    guardrailLimit:v.guardrailLimit,
    data:v
  }
}
