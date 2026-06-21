import { Calculator } from './types';

// Each calculator below uses the standard, published formula for that score.
// Sources are cited in `reference`. Verify against your local guidelines
// before relying on these clinically — that verification is the one step
// no AI tool can do for you.

export const calculatorsPart1: Calculator[] = [
  // 1. CKD-EPI 2021 (race-free) eGFR
  {
    slug: 'egfr-ckd-epi',
    name: 'eGFR Calculator (CKD-EPI 2021)',
    shortName: 'eGFR',
    category: 'Renal',
    description: 'Estimates glomerular filtration rate from serum creatinine, age, and sex.',
    tier: 'free',
    fields: [
      { id: 'creatinine', label: 'Serum creatinine', type: 'number', unit: 'mg/dL', step: 0.01, min: 0.1, max: 20 },
      { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 18, max: 120 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }] },
    ],
    calculate: (inputs) => {
      const scr = Number(inputs.creatinine);
      const age = Number(inputs.age);
      const isFemale = inputs.sex === 'female';
      const k = isFemale ? 0.7 : 0.9;
      const a = isFemale ? -0.241 : -0.302;
      const minScr = Math.min(scr / k, 1);
      const maxScr = Math.max(scr / k, 1);
      let egfr = 142 * Math.pow(minScr, a) * Math.pow(maxScr, -1.2) * Math.pow(0.9938, age);
      if (isFemale) egfr *= 1.012;
      egfr = Math.round(egfr * 10) / 10;

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (egfr >= 90) { interpretation = 'Normal kidney function (G1).'; severity = 'low'; }
      else if (egfr >= 60) { interpretation = 'Mildly decreased function (G2). Usually no symptoms.'; severity = 'low'; }
      else if (egfr >= 45) { interpretation = 'Mild-moderate CKD (G3a). Monitor and investigate cause.'; severity = 'moderate'; }
      else if (egfr >= 30) { interpretation = 'Moderate-severe CKD (G3b). Nephrology referral reasonable.'; severity = 'moderate'; }
      else if (egfr >= 15) { interpretation = 'Severe CKD (G4). Nephrology referral indicated, plan for renal replacement.'; severity = 'high'; }
      else { interpretation = 'Kidney failure (G5). Urgent nephrology input, dialysis/transplant planning.'; severity = 'critical'; }

      return { value: egfr, unit: 'mL/min/1.73m²', interpretation, severity };
    },
    reference: 'Inker LA et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. N Engl J Med. 2021.',
    clinicalGuide: `The CKD-EPI 2021 equation estimates glomerular filtration rate (eGFR) from serum creatinine, age, and sex, without a race coefficient — replacing the 2009 version after concerns that race-based adjustment overestimated kidney function in Black patients and delayed referral and transplant listing. eGFR is the standard way to stage chronic kidney disease (CKD) and guide drug dosing, contrast use, and referral timing. Results are reported in mL/min/1.73m², stratified into G1 (≥90) through G5 (<15). A single low reading should prompt a repeat test 3 months later before labeling someone with CKD, since creatinine fluctuates with hydration, muscle mass, and acute illness. eGFR underperforms in people with unusual muscle mass (bodybuilders, amputees) and in acute kidney injury, where creatinine hasn't yet equilibrated. Cystatin C-based or combined equations are more accurate in these edge cases. Clinically, eGFR drives decisions on ACE inhibitor/ARB dosing, metformin safety (generally fine above 30, caution below), contrast nephropathy risk before imaging, and nephrology referral thresholds (typically G4 or faster-than-expected decline). Always interpret alongside urine albumin-to-creatinine ratio (uACR) — the KDIGO heat map combines both axes for true risk stratification, since proteinuria with preserved eGFR still carries significant prognostic weight.`,
    keywords: ['egfr calculator', 'CKD-EPI calculator', 'creatinine clearance calculator', 'kidney function calculator'],
  },

  // 2. CHA2DS2-VASc
  {
    slug: 'chads-vasc',
    name: 'CHA₂DS₂-VASc Score Calculator',
    shortName: 'CHA₂DS₂-VASc',
    category: 'Cardiology',
    description: 'Estimates stroke risk in atrial fibrillation to guide anticoagulation decisions.',
    tier: 'free',
    fields: [
      { id: 'chf', label: 'Congestive heart failure / LV dysfunction', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'htn', label: 'Hypertension', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'age', label: 'Age', type: 'select', options: [{ label: 'Under 65', value: 'u65' }, { label: '65–74', value: '65to74' }, { label: '75 or older', value: 'o75' }] },
      { id: 'diabetes', label: 'Diabetes mellitus', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'stroke', label: 'Prior stroke / TIA / thromboembolism', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 2 }] },
      { id: 'vascular', label: 'Vascular disease (MI, PAD, aortic plaque)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
    ],
    calculate: (inputs) => {
      let score = 0;
      score += Number(inputs.chf);
      score += Number(inputs.htn);
      if (inputs.age === '65to74') score += 1;
      if (inputs.age === 'o75') score += 2;
      score += Number(inputs.diabetes);
      score += Number(inputs.stroke);
      score += Number(inputs.vascular);
      if (inputs.sex === 'female') score += 1;

      const riskTable: Record<number, number> = { 0: 0, 1: 1.3, 2: 2.2, 3: 3.2, 4: 4.0, 5: 6.7, 6: 9.8, 7: 9.6, 8: 6.7, 9: 15.2 };
      const annualStrokeRisk = riskTable[score] ?? 15.2;

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (score === 0) { interpretation = 'Low risk. Anticoagulation generally not recommended.'; severity = 'low'; }
      else if (score === 1) { interpretation = 'Low-moderate risk. Consider anticoagulation based on patient preference and bleeding risk (consider HAS-BLED).'; severity = 'moderate'; }
      else { interpretation = 'Anticoagulation recommended (score ≥2 in men, ≥3 in women) unless contraindicated.'; severity = 'high'; }

      return {
        value: score,
        unit: 'points',
        interpretation: `${interpretation} Estimated annual stroke risk: ~${annualStrokeRisk}%.`,
        severity,
      };
    },
    reference: 'Lip GY et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation. Chest. 2010.',
    clinicalGuide: `CHA₂DS₂-VASc estimates annual ischaemic stroke risk in people with non-valvular atrial fibrillation and is the standard tool guiding the decision to anticoagulate. Each letter represents a risk factor: congestive heart failure, hypertension, age (graded at 65–74 and ≥75), diabetes, prior stroke or TIA (weighted double, since prior stroke is the single strongest predictor), vascular disease, and female sex. The score ranges from 0 to 9. Current guidelines (ESC, NICE, AHA/ACC) recommend anticoagulation for a score of 2 or more in men and 3 or more in women, with a score of 1 (men) or 2 (women, from sex alone) representing a grey zone where shared decision-making and bleeding risk both matter. Female sex alone, without any other risk factor, is generally not considered sufficient to mandate anticoagulation — this nuance is frequently misapplied. The score should always be paired with a bleeding risk assessment such as HAS-BLED; a high stroke risk score does not override a prohibitive bleeding risk, and most patients with high stroke risk still benefit from anticoagulation even with moderately elevated bleeding risk, since stroke consequences are typically more severe than major bleeding. Common pitfalls: forgetting that "vascular disease" includes prior MI and peripheral arterial disease, not just coronary disease; and applying the score to valvular AF or rheumatic mitral stenosis, where it hasn't been validated and mechanical risk dominates instead.`,
    keywords: ['CHADS2 VASc calculator', 'CHA2DS2-VASc score', 'atrial fibrillation stroke risk calculator', 'AF anticoagulation calculator'],
  },

  // 3. Wells Score for DVT
  {
    slug: 'wells-dvt',
    name: 'Wells Score for DVT',
    shortName: 'Wells DVT',
    category: 'Cardiology',
    description: 'Estimates pre-test probability of deep vein thrombosis.',
    tier: 'free',
    fields: [
      { id: 'cancer', label: 'Active cancer (treatment within 6 months or palliative)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'paralysis', label: 'Paralysis, paresis, or recent leg immobilisation', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'bedridden', label: 'Bedridden >3 days or major surgery within 12 weeks', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'tenderness', label: 'Localised tenderness along deep venous system', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'legSwollen', label: 'Entire leg swollen', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'calfSwelling', label: 'Calf swelling >3cm vs other leg', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'pittingEdema', label: 'Pitting oedema, confined to symptomatic leg', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'collateralVeins', label: 'Collateral superficial veins (non-varicose)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'priorDvt', label: 'Previously documented DVT', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'altDiagnosis', label: 'Alternative diagnosis at least as likely as DVT', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: -2 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (score < 1) { interpretation = 'Low probability (~5%). Consider D-dimer; if negative, DVT effectively excluded.'; severity = 'low'; }
      else if (score <= 2) { interpretation = 'Moderate probability (~17%). D-dimer and/or ultrasound recommended.'; severity = 'moderate'; }
      else { interpretation = 'High probability (~53%). Proceed to ultrasound; do not rely on D-dimer alone.'; severity = 'high'; }
      return { value: score, unit: 'points', interpretation, severity };
    },
    reference: 'Wells PS et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. N Engl J Med. 2003.',
    clinicalGuide: `The Wells Score for DVT stratifies a patient's pre-test probability of deep vein thrombosis before any imaging, which determines whether D-dimer testing alone is sufficient to rule the diagnosis out or whether ultrasound is required regardless of D-dimer result. Ten clinical criteria are scored, each contributing one point except an alternative diagnosis at least as likely as DVT, which subtracts two points — reflecting how strongly clinical gestalt can argue against the diagnosis. A score below 1 is low probability; combined with a negative D-dimer, this reliably excludes DVT without imaging in most validated cohorts. A score of 1–2 is moderate probability, where a negative D-dimer is reassuring but less definitive. A score of 3 or more is high probability, where D-dimer should not be used to exclude DVT at all — proceed directly to compression ultrasound regardless of the result, since the pre-test probability is too high for a negative D-dimer to meaningfully lower post-test probability. The score performs less reliably in pregnancy, IV drug users, and patients with a prior DVT (where "previously documented DVT" itself is a criterion, creating some circularity) — these populations often warrant direct ultrasound. D-dimer also loses specificity with age, pregnancy, cancer, and recent surgery, raising false positive rates in exactly the populations where Wells often also scores higher, so clinical judgement should always sit alongside the calculated score, not replace it.`,
    keywords: ['Wells score DVT calculator', 'DVT probability calculator', 'deep vein thrombosis risk calculator'],
  },

  // 4. Wells Score for PE
  {
    slug: 'wells-pe',
    name: 'Wells Score for Pulmonary Embolism',
    shortName: 'Wells PE',
    category: 'Cardiology',
    description: 'Estimates pre-test probability of pulmonary embolism.',
    tier: 'free',
    fields: [
      { id: 'dvtSigns', label: 'Clinical signs of DVT', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 3 }] },
      { id: 'peLikely', label: 'PE is the most likely diagnosis', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 3 }] },
      { id: 'heartRate', label: 'Heart rate >100 bpm', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1.5 }] },
      { id: 'immobilisation', label: 'Immobilisation ≥3 days or surgery in past 4 weeks', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1.5 }] },
      { id: 'priorDvtPe', label: 'Previous DVT or PE', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1.5 }] },
      { id: 'haemoptysis', label: 'Haemoptysis', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'malignancy', label: 'Malignancy (treated within 6 months or palliative)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (score <= 4) { interpretation = 'PE unlikely (~12% prevalence). D-dimer can be used to rule out PE.'; severity = 'low'; }
      else { interpretation = 'PE likely (~37% prevalence). Proceed directly to CT pulmonary angiogram.'; severity = 'high'; }
      return { value: score, unit: 'points', interpretation, severity };
    },
    reference: 'Wells PS et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism. Thromb Haemost. 2000.',
    clinicalGuide: `The Wells Score for pulmonary embolism uses the dichotomised (two-tier) interpretation in most modern emergency protocols: a score of 4 or below means "PE unlikely," where D-dimer testing can safely exclude the diagnosis if negative; a score above 4 means "PE likely," where imaging (CT pulmonary angiogram, or V/Q scan if contrast is contraindicated) should proceed regardless of D-dimer. The two heaviest-weighted criteria — clinical signs of DVT and "PE is the most likely diagnosis" — each contribute 3 points, reflecting that clinical gestalt and physical exam findings carry more diagnostic weight than the other five criteria combined. The "PE is the most likely diagnosis" item is subjective by design and depends on the assessing clinician having genuinely considered and ruled out alternatives (pneumonia, ACS, pneumothorax) rather than defaulting to PE because it's on the differential. As with DVT, D-dimer sensitivity is high but specificity drops in older patients, pregnancy, and active cancer — in these groups, even a "PE unlikely" score with positive D-dimer should be interpreted cautiously, and the YEARS algorithm or age-adjusted D-dimer thresholds are increasingly used to reduce unnecessary CT scanning. In pregnancy specifically, neither Wells nor standard D-dimer thresholds are well validated, and most centres follow pregnancy-specific pathways instead. The Geneva score is a validated alternative with similar performance; Wells remains more widely used due to familiarity and fewer required inputs.`,
    keywords: ['Wells score PE calculator', 'pulmonary embolism probability calculator', 'PE risk calculator'],
  },

  // 5. CURB-65
  {
    slug: 'curb-65',
    name: 'CURB-65 Pneumonia Severity Score',
    shortName: 'CURB-65',
    category: 'Respiratory',
    description: 'Estimates mortality risk in community-acquired pneumonia to guide admission decisions.',
    tier: 'free',
    fields: [
      { id: 'confusion', label: 'New confusion (disorientation in person, place, time)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'urea', label: 'Urea >7 mmol/L (>19 mg/dL BUN)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'respRate', label: 'Respiratory rate ≥30/min', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'bp', label: 'BP: systolic <90 or diastolic ≤60 mmHg', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'age65', label: 'Age ≥65', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (score <= 1) { interpretation = 'Low risk (~1.5% mortality). Outpatient treatment appropriate.'; severity = 'low'; }
      else if (score === 2) { interpretation = 'Moderate risk (~9.2% mortality). Consider short inpatient stay or hospital-supervised outpatient treatment.'; severity = 'moderate'; }
      else if (score === 3) { interpretation = 'High risk (~14.5% mortality). Hospitalise; consider ICU assessment.'; severity = 'high'; }
      else { interpretation = 'Severe risk (~40% mortality at 4-5). Hospitalise, assess for ICU/HDU admission.'; severity = 'critical'; }
      return { value: score, unit: 'points', interpretation, severity };
    },
    reference: 'Lim WS et al. Defining community acquired pneumonia severity on presentation to hospital. Thorax. 2003.',
    clinicalGuide: `CURB-65 stratifies 30-day mortality risk in community-acquired pneumonia and is the standard UK/NICE tool for deciding between outpatient treatment, short admission, and ICU assessment. The five criteria — confusion, urea, respiratory rate, blood pressure, and age 65+ — are each worth one point, with scores of 0–1 favouring outpatient antibiotics, 2 suggesting consideration of hospital admission, and 3 or more indicating severe pneumonia requiring hospitalisation with ICU/HDU assessment. CRB-65 is a simplified variant omitting urea, useful in primary care or any setting without immediate access to bloods, since the four remaining criteria can be assessed at the bedside alone. A key limitation is that CURB-65 was derived and validated as a mortality predictor, not as a comprehensive severity score — it can underestimate severity in younger patients with single-organ failure (e.g., a 30-year-old with severe hypoxia but a low CURB-65 due to age) and doesn't capture oxygenation directly. SMART-COP and the ATS/IDSA severe CAP criteria incorporate oxygenation and are sometimes preferred in ICU triage decisions for this reason. Clinically, CURB-65 should inform but not override gestalt: a patient scoring 1 who looks unwell, has significant comorbidity, or lives alone with poor social support may still warrant admission, and conversely a stable score-2 patient with reliable follow-up may be appropriate for an ambulatory care pathway in services that offer one.`,
    keywords: ['CURB-65 calculator', 'pneumonia severity score', 'community acquired pneumonia calculator'],
  },

  // 6. Corrected Calcium
  {
    slug: 'corrected-calcium',
    name: 'Corrected Calcium Calculator',
    shortName: 'Corrected Ca²⁺',
    category: 'Metabolic',
    description: 'Adjusts total serum calcium for albumin level.',
    tier: 'free',
    fields: [
      { id: 'calcium', label: 'Total serum calcium', type: 'number', unit: 'mg/dL', step: 0.1, min: 1, max: 20 },
      { id: 'albumin', label: 'Serum albumin', type: 'number', unit: 'g/dL', step: 0.1, min: 0.5, max: 6 },
    ],
    calculate: (inputs) => {
      const ca = Number(inputs.calcium);
      const alb = Number(inputs.albumin);
      const corrected = Math.round((ca + 0.8 * (4 - alb)) * 100) / 100;

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (corrected < 8.5) { interpretation = 'Corrected calcium is low (hypocalcaemia). Check PTH, vitamin D, magnesium.'; severity = 'moderate'; }
      else if (corrected > 10.5) { interpretation = 'Corrected calcium is high (hypercalcaemia). Check PTH to differentiate primary hyperparathyroidism from malignancy and other causes.'; severity = 'high'; }
      else { interpretation = 'Corrected calcium is within normal range.'; severity = 'low'; }

      return { value: corrected, unit: 'mg/dL', interpretation, severity };
    },
    reference: 'Payne RB et al. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ. 1973.',
    clinicalGuide: `Roughly 40% of serum calcium is bound to albumin, so total calcium readings are misleading whenever albumin is abnormal — most commonly low albumin in unwell hospitalised patients, which makes total calcium look falsely low even when the physiologically active ionised fraction is normal. The correction formula adds 0.8 mg/dL to the measured calcium for every 1 g/dL that albumin sits below 4 g/dL (the reference midpoint), and subtracts proportionally if albumin is elevated. This corrected value approximates what calcium would read if albumin were normal. The correction is a widely used approximation, not a substitute for directly measuring ionised calcium, which remains the gold standard when results are borderline, when the clinical picture doesn't match the corrected value, or in critically ill patients with major acid-base disturbances, since pH itself shifts the bound/unbound calcium ratio independent of albumin. Causes of true hypocalcaemia include vitamin D deficiency, hypoparathyroidism, chronic kidney disease, and magnesium deficiency (which impairs PTH secretion); true hypercalcaemia is most often primary hyperparathyroidism in outpatients and malignancy in inpatients, distinguished by checking PTH — high or high-normal PTH points to a parathyroid cause, while suppressed PTH points to PTH-independent causes like malignancy, granulomatous disease, or vitamin D excess. Severe hypercalcaemia (>14 mg/dL) or symptomatic hypocalcaemia (tetany, seizures, prolonged QT) both require urgent treatment, not just calculation.`,
    keywords: ['corrected calcium calculator', 'calcium albumin correction calculator', 'hypocalcaemia calculator'],
  },

  // 7. Anion Gap
  {
    slug: 'anion-gap',
    name: 'Anion Gap Calculator',
    shortName: 'Anion gap',
    category: 'Metabolic',
    description: 'Calculates the anion gap to help classify metabolic acidosis.',
    tier: 'free',
    fields: [
      { id: 'sodium', label: 'Sodium', type: 'number', unit: 'mmol/L', min: 100, max: 180 },
      { id: 'chloride', label: 'Chloride', type: 'number', unit: 'mmol/L', min: 60, max: 140 },
      { id: 'bicarbonate', label: 'Bicarbonate (HCO₃⁻)', type: 'number', unit: 'mmol/L', min: 1, max: 50 },
      { id: 'albumin', label: 'Albumin (optional, for albumin-corrected gap)', type: 'number', unit: 'g/dL', step: 0.1, min: 0, max: 6, placeholder: 'leave blank if unknown' },
    ],
    calculate: (inputs) => {
      const na = Number(inputs.sodium);
      const cl = Number(inputs.chloride);
      const hco3 = Number(inputs.bicarbonate);
      const albumin = inputs.albumin ? Number(inputs.albumin) : null;

      const gap = Math.round((na - (cl + hco3)) * 10) / 10;
      let correctedGap = gap;
      if (albumin !== null && albumin > 0) {
        correctedGap = Math.round((gap + 2.5 * (4 - albumin)) * 10) / 10;
      }

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      const displayGap = albumin !== null ? correctedGap : gap;
      if (displayGap > 12) { interpretation = 'Elevated anion gap. Consider MUDPILES causes: methanol, uraemia, DKA, propylene glycol, isoniazid/iron, lactic acidosis, ethylene glycol, salicylates.'; severity = 'high'; }
      else if (displayGap < 8) { interpretation = 'Low anion gap — consider hypoalbuminaemia (if not already corrected), multiple myeloma, or lab error.'; severity = 'moderate'; }
      else { interpretation = 'Normal anion gap. If acidotic, consider non-anion-gap causes: diarrhoea, renal tubular acidosis, early renal failure.'; severity = 'low'; }

      return {
        value: displayGap,
        unit: 'mmol/L',
        interpretation,
        severity,
        breakdown: albumin !== null ? [{ label: 'Uncorrected gap', value: gap }, { label: 'Albumin-corrected gap', value: correctedGap }] : undefined,
      };
    },
    reference: 'Emmett M, Narins RG. Clinical use of the anion gap. Medicine. 1977.',
    clinicalGuide: `The anion gap (sodium minus the sum of chloride and bicarbonate) estimates unmeasured anions in the blood and is the first step in classifying a metabolic acidosis. A normal gap is roughly 8–12 mmol/L, though local lab reference ranges vary based on measurement method. An elevated gap points toward an unmeasured acid accumulating in the blood, classically remembered through mnemonics like MUDPILES: methanol, uraemia, diabetic ketoacidosis, propylene glycol, isoniazid or iron overdose, lactic acidosis, ethylene glycol, and salicylates. A normal-gap (hyperchloraemic) metabolic acidosis instead suggests bicarbonate loss or impaired renal acid excretion — diarrhoea, renal tubular acidosis, or early renal failure, and ammonium chloride or other chloride-rich fluid administration. Albumin correction matters because albumin is itself a major unmeasured anion: hypoalbuminaemia (common in sepsis, malnutrition, liver disease) artificially lowers the calculated gap, potentially masking a clinically significant elevated-gap acidosis. The correction adds 2.5 mmol/L for every 1 g/dL albumin sits below 4 g/dL. In practice, always interpret the anion gap alongside a full venous or arterial blood gas, lactate, ketones, and osmolar gap when toxic alcohol ingestion is suspected — the anion gap alone cannot distinguish between its many causes, it only narrows the differential and tells you whether you're looking for an unmeasured acid or a bicarbonate-loss process.`,
    keywords: ['anion gap calculator', 'metabolic acidosis calculator', 'albumin corrected anion gap'],
  },

  // 8. APGAR Score
  {
    slug: 'apgar-score',
    name: 'APGAR Score Calculator',
    shortName: 'APGAR',
    category: 'Obstetric/Neonatal',
    description: 'Assesses newborn condition at 1 and 5 minutes after birth.',
    tier: 'free',
    fields: [
      { id: 'appearance', label: 'Appearance (skin colour)', type: 'select', options: [{ label: 'Blue/pale all over', value: 0 }, { label: 'Body pink, extremities blue', value: 1 }, { label: 'Pink all over', value: 2 }] },
      { id: 'pulse', label: 'Pulse', type: 'select', options: [{ label: 'Absent', value: 0 }, { label: 'Below 100/min', value: 1 }, { label: '100/min or above', value: 2 }] },
      { id: 'grimace', label: 'Grimace (reflex irritability)', type: 'select', options: [{ label: 'No response', value: 0 }, { label: 'Grimace', value: 1 }, { label: 'Cry/cough/sneeze on stimulation', value: 2 }] },
      { id: 'activity', label: 'Activity (muscle tone)', type: 'select', options: [{ label: 'Limp', value: 0 }, { label: 'Some flexion', value: 1 }, { label: 'Active motion', value: 2 }] },
      { id: 'respiration', label: 'Respiration', type: 'select', options: [{ label: 'Absent', value: 0 }, { label: 'Slow/irregular', value: 1 }, { label: 'Good, crying', value: 2 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (score >= 7) { interpretation = 'Reassuring. Routine post-natal care.'; severity = 'low'; }
      else if (score >= 4) { interpretation = 'Moderately abnormal. May need stimulation, suction, oxygen — assess and reassess promptly.'; severity = 'moderate'; }
      else { interpretation = 'Low score. Needs immediate resuscitation per NLS/NRP algorithm.'; severity = 'high'; }
      return { value: score, unit: '/10', interpretation, severity };
    },
    reference: 'Apgar V. A proposal for a new method of evaluation of the newborn infant. Anesth Analg. 1953.',
    clinicalGuide: `The APGAR score is a rapid, standardised assessment of a newborn's condition, traditionally performed at 1 and 5 minutes after birth (and repeated every 5 minutes if resuscitation continues beyond 5 minutes). It scores five components — appearance, pulse, grimace, activity, and respiration — each from 0 to 2, for a maximum of 10. The 1-minute score reflects how the baby tolerated labour and delivery and guides the immediate decision on whether resuscitation is needed; it does not predict long-term outcome. The 5-minute score is more predictive of short-term outcomes and is documented as the primary score in most records, with persistently low scores at 10 minutes carrying more prognostic weight for neurodevelopmental outcome. A score of 7–10 is reassuring and needs only routine care; 4–6 is moderately abnormal and usually responds to stimulation, drying, and airway clearance; below 4 indicates a baby needing immediate resuscitation per Newborn Life Support (NLS) or Neonatal Resuscitation Program (NRP) protocols — positive pressure ventilation, and chest compressions if the heart rate remains below 60 despite adequate ventilation. A common misconception is that APGAR alone determines whether resuscitation is started — in practice, resuscitation begins based on real-time assessment of tone, breathing, and heart rate immediately at birth, and the APGAR score is recorded as a structured summary of the response, not used to delay the decision to intervene. Low APGAR scores correlate weakly with long-term outcomes in isolation; cord gas results and the clinical course over the following hours are more informative for prognosis.`,
    keywords: ['APGAR score calculator', 'newborn APGAR calculator', 'neonatal assessment score'],
  },

  // 9. Glasgow Coma Scale
  {
    slug: 'glasgow-coma-scale',
    name: 'Glasgow Coma Scale (GCS) Calculator',
    shortName: 'GCS',
    category: 'Neurology',
    description: 'Assesses level of consciousness after head injury or in critical illness.',
    tier: 'free',
    fields: [
      { id: 'eye', label: 'Eye opening', type: 'select', options: [{ label: 'No eye opening', value: 1 }, { label: 'To pain', value: 2 }, { label: 'To speech', value: 3 }, { label: 'Spontaneous', value: 4 }] },
      { id: 'verbal', label: 'Verbal response', type: 'select', options: [{ label: 'No response', value: 1 }, { label: 'Incomprehensible sounds', value: 2 }, { label: 'Inappropriate words', value: 3 }, { label: 'Confused', value: 4 }, { label: 'Oriented', value: 5 }] },
      { id: 'motor', label: 'Motor response', type: 'select', options: [{ label: 'No response', value: 1 }, { label: 'Extension to pain', value: 2 }, { label: 'Abnormal flexion to pain', value: 3 }, { label: 'Withdraws from pain', value: 4 }, { label: 'Localises pain', value: 5 }, { label: 'Obeys commands', value: 6 }] },
    ],
    calculate: (inputs) => {
      const score = Number(inputs.eye) + Number(inputs.verbal) + Number(inputs.motor);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (score >= 13) { interpretation = 'Mild impairment of consciousness.'; severity = 'low'; }
      else if (score >= 9) { interpretation = 'Moderate impairment. Close monitoring required.'; severity = 'moderate'; }
      else { interpretation = 'Severe impairment (GCS ≤8 = coma threshold). Airway protection and urgent senior/critical care input required.'; severity = 'critical'; }
      return {
        value: score,
        unit: '/15',
        interpretation,
        severity,
        breakdown: [{ label: 'Eye', value: inputs.eye }, { label: 'Verbal', value: inputs.verbal }, { label: 'Motor', value: inputs.motor }],
      };
    },
    reference: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness. Lancet. 1974.',
    clinicalGuide: `The Glasgow Coma Scale assesses level of consciousness across three domains — eye opening (1–4), verbal response (1–5), and motor response (1–6) — for a total ranging from 3 (deepest coma, with no response in any domain) to 15 (fully alert). A GCS of 8 or below is the conventional threshold for "coma" and typically prompts consideration of airway protection, since the ability to maintain a patent airway and protect against aspiration is often lost below this level. Always report and document the three components separately (e.g., E2V3M5) rather than only the total — the breakdown carries clinical information the sum alone loses, since the same total score can represent very different clinical pictures depending on which domain is impaired. The motor score is the single most predictive component for outcome after traumatic brain injury and is weighted most heavily in scales like the pre-hospital "GCS-M" simplification used by some EMS systems. Common pitfalls include scoring verbal response in intubated patients (document as "T" for tube, not as a numeric score, since a true verbal response cannot be assessed) and confusing "withdraws from pain" with "localises pain" — localisation requires a purposeful movement toward the stimulus, not just withdrawal. GCS has known limitations in patients who are intoxicated, have pre-existing aphasia or dementia, are sedated, or have facial/eye trauma preventing assessment of eye opening — in these situations, the score should be interpreted cautiously and supplemented with other neurological assessment tools such as the FOUR score, which assesses brainstem reflexes and respiratory pattern in addition to consciousness.`,
    keywords: ['Glasgow Coma Scale calculator', 'GCS calculator', 'GCS score head injury'],
  },

  // 10. Mean Arterial Pressure
  {
    slug: 'mean-arterial-pressure',
    name: 'Mean Arterial Pressure (MAP) Calculator',
    shortName: 'MAP',
    category: 'Critical Care',
    description: 'Calculates mean arterial pressure from systolic and diastolic blood pressure.',
    tier: 'free',
    fields: [
      { id: 'systolic', label: 'Systolic BP', type: 'number', unit: 'mmHg', min: 40, max: 300 },
      { id: 'diastolic', label: 'Diastolic BP', type: 'number', unit: 'mmHg', min: 20, max: 200 },
    ],
    calculate: (inputs) => {
      const sbp = Number(inputs.systolic);
      const dbp = Number(inputs.diastolic);
      const map = Math.round((dbp + (sbp - dbp) / 3) * 10) / 10;

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (map < 60) { interpretation = 'Below the threshold generally needed for adequate organ perfusion. Investigate and treat the cause of hypotension urgently.'; severity = 'high'; }
      else if (map < 65) { interpretation = 'Borderline low — many sepsis protocols target a MAP ≥65 mmHg; review fluid status and consider vasopressor support.'; severity = 'moderate'; }
      else { interpretation = 'Adequate for most organ perfusion (target ≥65 mmHg in critical illness).'; severity = 'low'; }

      return { value: map, unit: 'mmHg', interpretation, severity };
    },
    reference: 'Standard haemodynamic formula; sepsis MAP target per Surviving Sepsis Campaign guidelines.',
    clinicalGuide: `Mean arterial pressure (MAP) approximates the average pressure driving blood flow into organs across the cardiac cycle, weighted toward diastole since the heart spends roughly two-thirds of each cycle in diastole. The standard estimate, MAP = DBP + (SBP − DBP)/3, is accurate at normal heart rates but becomes less reliable at high heart rates, where diastole shortens disproportionately — at very high rates an arterial line waveform integration gives a more accurate value than the formula. A MAP of at least 65 mmHg is the most widely used resuscitation target in sepsis and septic shock, per the Surviving Sepsis Campaign guidelines, based on evidence that organ perfusion — particularly renal — falls off below this threshold in most patients. Some patients, particularly those with chronic hypertension and atherosclerosis, may need a higher individualised target to maintain adequate cerebral and renal perfusion, since their autoregulation curve has shifted rightward; conversely, a lower target may be acceptable in younger, previously normotensive patients. MAP is also central to neurocritical care, where cerebral perfusion pressure (CPP = MAP − ICP) must be maintained, often requiring a higher MAP target in the presence of raised intracranial pressure. In practice, MAP should never be interpreted in isolation — a "normal" MAP can coexist with poor perfusion (e.g., in vasoconstricted shock states) and lactate, urine output, capillary refill, and mental status all provide complementary information about whether perfusion is actually adequate, not just the number on the monitor.`,
    keywords: ['MAP calculator', 'mean arterial pressure calculator', 'MAP blood pressure calculator'],
  },
];
