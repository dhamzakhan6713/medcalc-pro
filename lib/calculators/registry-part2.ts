import { Calculator } from './types';

export const calculatorsPart2: Calculator[] = [
  // 11. Child-Pugh Score
  {
    slug: 'child-pugh',
    name: 'Child-Pugh Score Calculator',
    shortName: 'Child-Pugh',
    category: 'Hepatology',
    description: 'Grades severity of cirrhosis and estimates prognosis.',
    tier: 'free',
    fields: [
      { id: 'bilirubin', label: 'Total bilirubin', type: 'select', options: [{ label: '<2 mg/dL (<34 µmol/L)', value: 1 }, { label: '2–3 mg/dL (34–50 µmol/L)', value: 2 }, { label: '>3 mg/dL (>50 µmol/L)', value: 3 }] },
      { id: 'albumin', label: 'Albumin', type: 'select', options: [{ label: '>3.5 g/dL', value: 1 }, { label: '2.8–3.5 g/dL', value: 2 }, { label: '<2.8 g/dL', value: 3 }] },
      { id: 'inr', label: 'INR', type: 'select', options: [{ label: '<1.7', value: 1 }, { label: '1.7–2.3', value: 2 }, { label: '>2.3', value: 3 }] },
      { id: 'ascites', label: 'Ascites', type: 'select', options: [{ label: 'None', value: 1 }, { label: 'Mild (controlled with diuretics)', value: 2 }, { label: 'Moderate-severe (refractory)', value: 3 }] },
      { id: 'encephalopathy', label: 'Hepatic encephalopathy', type: 'select', options: [{ label: 'None', value: 1 }, { label: 'Grade 1-2 (mild, controlled)', value: 2 }, { label: 'Grade 3-4 (severe, refractory)', value: 3 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let cls = '';
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (score <= 6) { cls = 'A'; interpretation = 'Class A — compensated cirrhosis. ~1-year survival ~95-100%.'; severity = 'low'; }
      else if (score <= 9) { cls = 'B'; interpretation = 'Class B — significant functional compromise. ~1-year survival ~80%.'; severity = 'moderate'; }
      else { cls = 'C'; interpretation = 'Class C — decompensated cirrhosis. ~1-year survival ~45%. Consider transplant referral.'; severity = 'high'; }
      return { value: `${score} (Class ${cls})`, interpretation, severity };
    },
    reference: 'Pugh RN et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973.',
    clinicalGuide: `The Child-Pugh score grades the severity of cirrhosis and estimates prognosis using five variables: bilirubin, albumin, INR, ascites, and hepatic encephalopathy. Each is scored 1–3, giving a total of 5–15, which maps to Class A (5–6, compensated, best prognosis), Class B (7–9, significant compromise), or Class C (10–15, decompensated, worst prognosis). It has long been used to guide decisions on variceal bleeding risk, surgical risk stratification before non-transplant abdominal surgery, and historically to prioritise liver transplant candidates, though the MELD score has now largely replaced Child-Pugh for transplant allocation because MELD uses continuous lab values (creatinine, bilirubin, INR, sodium) rather than the somewhat subjective ascites and encephalopathy grading, giving it better discrimination and reproducibility between observers. Child-Pugh remains useful clinically because it's quick to calculate at the bedside and correlates well with overall hepatic reserve and operative risk — Child-Pugh C patients carry substantially elevated mortality for almost any major surgery, often prompting a non-surgical or minimally invasive alternative where possible. The main limitation is inter-observer variability in grading ascites and encephalopathy severity, which are clinical judgements rather than lab values, making the score less reproducible across different assessors compared with MELD. It also doesn't account for renal function, a major driver of mortality in advanced liver disease and a key reason MELD (which includes creatinine) has become the dominant scoring system for transplant listing, even though Child-Pugh persists in everyday clinical risk communication and many surgical risk calculators.`,
    keywords: ['Child-Pugh score calculator', 'cirrhosis severity calculator', 'liver disease score'],
  },

  // 12. MELD Score
  {
    slug: 'meld-score',
    name: 'MELD Score Calculator',
    shortName: 'MELD',
    category: 'Hepatology',
    description: 'Estimates 90-day mortality in liver disease; used for transplant prioritisation.',
    tier: 'free',
    fields: [
      { id: 'bilirubin', label: 'Bilirubin', type: 'number', unit: 'mg/dL', step: 0.1, min: 0.1, max: 50 },
      { id: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL', step: 0.1, min: 0.1, max: 20 },
      { id: 'inr', label: 'INR', type: 'number', step: 0.1, min: 0.5, max: 10 },
      { id: 'sodium', label: 'Sodium', type: 'number', unit: 'mmol/L', min: 100, max: 180 },
      { id: 'dialysis', label: 'Had dialysis ≥2x in past week', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
    ],
    calculate: (inputs) => {
      let creat = Number(inputs.creatinine);
      const bili = Math.max(Number(inputs.bilirubin), 1);
      const inr = Math.max(Number(inputs.inr), 1);
      let na = Number(inputs.sodium);
      na = Math.min(Math.max(na, 125), 137);
      if (Number(inputs.dialysis) === 1) creat = 4.0;
      creat = Math.min(Math.max(creat, 1), 4);

      const meldRaw = 3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(creat) + 6.43;
      const meldNa = Math.round(meldRaw + 1.32 * (137 - na) - (0.033 * meldRaw * (137 - na)));
      const finalScore = Math.min(Math.max(meldNa, 6), 40);

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (finalScore < 10) { interpretation = 'Low risk. ~1.9% 3-month mortality.'; severity = 'low'; }
      else if (finalScore < 20) { interpretation = 'Moderate risk. ~6-20% 3-month mortality. Consider transplant work-up.'; severity = 'moderate'; }
      else if (finalScore < 30) { interpretation = 'High risk. ~19.6-52.6% 3-month mortality. Transplant evaluation priority.'; severity = 'high'; }
      else { interpretation = 'Very high risk. >50% 3-month mortality. Urgent transplant evaluation.'; severity = 'critical'; }

      return { value: finalScore, unit: 'points (MELD-Na)', interpretation, severity };
    },
    reference: 'Kim WR et al. MELD-Na score for liver transplant allocation. Gastroenterology. 2008. UNOS allocation policy.',
    clinicalGuide: `The MELD-Na score (Model for End-Stage Liver Disease, sodium-adjusted) estimates 3-month mortality risk in patients with cirrhosis and is the primary score used by transplant networks like UNOS to prioritise organ allocation — patients with higher scores are sicker and receive higher priority. It's calculated from bilirubin, INR, creatinine, and sodium, with all input values bounded within fixed ranges to prevent extreme labs from disproportionately skewing the score (for example, creatinine is capped at 4 mg/dL, and any value above this, or a patient on dialysis, is treated as exactly 4). Sodium was added to the original MELD formula because hyponatraemia independently predicts mortality in cirrhosis beyond what bilirubin, INR, and creatinine alone capture, and the sodium-adjusted version improved prediction accuracy enough to become the standard. A MELD-Na below 10 suggests relatively low short-term mortality risk and outpatient management; scores of 15 and above generally prompt formal transplant referral discussions, since transplant survival benefit begins to clearly outweigh transplant risk around this threshold; scores above 30 represent very high acute mortality risk and usually reflect ICU-level decompensation. Exception points exist for conditions that MELD underestimates, such as hepatocellular carcinoma within transplant criteria or hepatopulmonary syndrome, where the calculated score doesn't reflect true urgency and standardised exception MELD points are applied instead. Clinically, MELD should be recalculated regularly in decompensating patients, since transplant priority is based on current, not historical, severity — a single calculation at admission becomes stale within days in a clinically evolving patient.`,
    keywords: ['MELD score calculator', 'MELD-Na calculator', 'liver transplant score'],
  },

  // 13. HAS-BLED
  {
    slug: 'has-bled',
    name: 'HAS-BLED Bleeding Risk Score',
    shortName: 'HAS-BLED',
    category: 'Cardiology',
    description: 'Estimates major bleeding risk in patients on anticoagulation for atrial fibrillation.',
    tier: 'free',
    fields: [
      { id: 'hypertension', label: 'Hypertension (uncontrolled, SBP >160)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'renal', label: 'Abnormal renal function (dialysis, transplant, Cr >2.26 mg/dL)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'liver', label: 'Abnormal liver function (cirrhosis, bilirubin >2x normal)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'stroke', label: 'Prior stroke', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'bleeding', label: 'Prior major bleeding or predisposition', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'labileInr', label: 'Labile INR (unstable/high, time in range <60%)', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'elderly', label: 'Age >65', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'drugs', label: 'Drugs (antiplatelets/NSAIDs) or alcohol excess', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (score <= 1) { interpretation = 'Low bleeding risk (~1% major bleeds/year).'; severity = 'low'; }
      else if (score === 2) { interpretation = 'Moderate bleeding risk (~2% major bleeds/year). Anticoagulation usually still reasonable.'; severity = 'moderate'; }
      else { interpretation = 'High bleeding risk (≥4% major bleeds/year). Does not automatically contraindicate anticoagulation, but warrants closer monitoring and addressing modifiable risk factors.'; severity = 'high'; }
      return { value: score, unit: 'points', interpretation, severity };
    },
    reference: 'Pisters R et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding. Chest. 2010.',
    clinicalGuide: `HAS-BLED estimates 1-year major bleeding risk in patients with atrial fibrillation being considered for anticoagulation, and is intended to be used alongside CHA₂DS₂-VASc — not as a competing score, but as a complementary input into the same shared decision. A high HAS-BLED score should prompt closer monitoring and correction of modifiable risk factors (uncontrolled hypertension, labile INR, concurrent antiplatelet or NSAID use) rather than automatically withholding anticoagulation, since most patients with both high stroke risk and high bleeding risk still gain net benefit from anticoagulation — strokes tend to cause more severe and permanent disability than most major bleeds. The score deliberately separates modifiable factors (hypertension control, INR stability, concurrent drugs) from fixed factors (age, prior stroke, prior bleeding), which is clinically useful because it identifies what can actually be acted on before or during treatment, rather than simply producing a number. A common error is treating a HAS-BLED score of 3 or more as an automatic contraindication to anticoagulation — guidelines explicitly caution against this, framing the score instead as a flag for increased vigilance, more frequent follow-up, and consideration of agents with better bleeding profiles (e.g., DOACs over warfarin in eligible patients, given their generally lower intracranial haemorrhage risk). Other bleeding risk scores exist (ORBIT, ATRIA) with varying performance characteristics, but HAS-BLED remains the most widely adopted in clinical guidelines due to its simplicity and the volume of validation data behind it.`,
    keywords: ['HAS-BLED calculator', 'bleeding risk score calculator', 'anticoagulation bleeding risk'],
  },

  // 14. Cockcroft-Gault
  {
    slug: 'cockcroft-gault',
    name: 'Cockcroft-Gault Creatinine Clearance',
    shortName: 'Cockcroft-Gault',
    category: 'Renal',
    description: 'Estimates creatinine clearance for drug dosing decisions.',
    tier: 'free',
    fields: [
      { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 18, max: 120 },
      { id: 'weight', label: 'Weight', type: 'number', unit: 'kg', step: 0.1, min: 20, max: 300 },
      { id: 'creatinine', label: 'Serum creatinine', type: 'number', unit: 'mg/dL', step: 0.01, min: 0.1, max: 20 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
    ],
    calculate: (inputs) => {
      const age = Number(inputs.age);
      const weight = Number(inputs.weight);
      const scr = Number(inputs.creatinine);
      const isFemale = inputs.sex === 'female';

      let crcl = ((140 - age) * weight) / (72 * scr);
      if (isFemale) crcl *= 0.85;
      crcl = Math.round(crcl * 10) / 10;

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (crcl >= 90) { interpretation = 'Normal clearance. Standard drug dosing usually appropriate.'; severity = 'low'; }
      else if (crcl >= 60) { interpretation = 'Mildly reduced. Check dosing for renally-cleared drugs.'; severity = 'low'; }
      else if (crcl >= 30) { interpretation = 'Moderately reduced. Dose adjustment likely needed for many renally-cleared drugs.'; severity = 'moderate'; }
      else { interpretation = 'Severely reduced. Significant dose adjustment or avoidance needed for many drugs — check individual drug references.'; severity = 'high'; }

      return { value: crcl, unit: 'mL/min', interpretation, severity };
    },
    reference: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976.',
    clinicalGuide: `The Cockcroft-Gault equation estimates creatinine clearance using age, weight, sex, and serum creatinine, and remains the standard equation referenced in most drug dosing tables and package inserts — including for many anticoagulants like DOACs, where dosing thresholds were derived using Cockcroft-Gault in the original pivotal trials. This matters clinically because CKD-EPI (used for CKD staging) and Cockcroft-Gault (used for drug dosing) can produce meaningfully different numbers in the same patient, especially at extremes of body weight, and using the wrong equation for the wrong purpose can lead to incorrect dosing — always use Cockcroft-Gault specifically when a drug label or dosing reference says "creatinine clearance," not eGFR. Actual body weight is used in the standard formula, but in obese patients this can overestimate renal function, since excess fat doesn't generate creatinine the way muscle does; many clinicians substitute an adjusted or ideal body weight in significantly obese patients, although there's no universal consensus on which adjustment is most accurate, and local pharmacy guidance should be followed where available. Conversely, in patients with low muscle mass (frail elderly, amputees, cachexia), Cockcroft-Gault can overestimate clearance because creatinine production is reduced, making the patient appear to have better renal function than they truly do — this is a frequent cause of unintentional drug toxicity in elderly inpatients. As with all creatinine-based equations, results are unreliable in acute kidney injury, where creatinine has not yet reached steady state and any single value reflects a moving target rather than true renal function.`,
    keywords: ['Cockcroft-Gault calculator', 'creatinine clearance calculator', 'drug dosing renal calculator'],
  },

  // 15. Ideal Body Weight
  {
    slug: 'ideal-body-weight',
    name: 'Ideal Body Weight Calculator',
    shortName: 'IBW',
    category: 'General',
    description: 'Estimates ideal body weight for drug dosing and ventilator settings.',
    tier: 'free',
    fields: [
      { id: 'heightCm', label: 'Height', type: 'number', unit: 'cm', min: 100, max: 250 },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
      { id: 'actualWeight', label: 'Actual weight (optional, for % IBW)', type: 'number', unit: 'kg', step: 0.1, min: 10, max: 400, placeholder: 'leave blank if unknown' },
    ],
    calculate: (inputs) => {
      const heightCm = Number(inputs.heightCm);
      const heightInches = heightCm / 2.54;
      const isFemale = inputs.sex === 'female';
      const baseHeight = 60; // inches, = 5 feet
      const inchesOver5ft = Math.max(heightInches - baseHeight, 0);

      const ibw = isFemale ? 45.5 + 2.3 * inchesOver5ft : 50 + 2.3 * inchesOver5ft;
      const roundedIbw = Math.round(ibw * 10) / 10;

      let interpretation = `Devine formula ideal body weight. Used for drug dosing (e.g. aminoglycosides) and ventilator tidal volume settings (typically 6-8 mL/kg IBW).`;
      if (inputs.actualWeight) {
        const actual = Number(inputs.actualWeight);
        const pctIbw = Math.round((actual / roundedIbw) * 100);
        interpretation += ` Actual weight is ${pctIbw}% of IBW.`;
      }

      return { value: roundedIbw, unit: 'kg', interpretation, severity: 'neutral' };
    },
    reference: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974.',
    clinicalGuide: `Ideal body weight (IBW), most commonly calculated using the Devine formula, estimates what a person's weight "should" be based on height and sex, and is used clinically not as a goal weight for patients but as a dosing weight for specific drugs and clinical calculations where actual body weight would lead to inaccurate results. The two most important applications are aminoglycoside antibiotic dosing (gentamicin, tobramycin), where dosing on actual weight in obese patients risks toxic drug levels since these drugs don't distribute well into fat tissue, and mechanical ventilator tidal volume settings, where lung size correlates with height and IBW, not actual body weight — using actual weight in an obese patient would set a dangerously high tidal volume relative to true lung capacity, increasing ventilator-associated lung injury risk. For underweight or normal-weight patients, actual body weight and IBW are often similar, so the distinction matters most in patients above or below typical body weight. In morbidly obese patients, many drug protocols use an "adjusted body weight" (AdjBW = IBW + 0.4 × (actual weight − IBW)) rather than pure IBW, since some drug distribution does scale partially with excess weight even though full actual-weight dosing would overshoot — the specific adjustment factor and whether to use IBW, AdjBW, or actual weight varies by drug class and should be checked against current dosing references rather than assumed universally. IBW should never be used as a clinical or psychological target weight to communicate to patients; it is a pharmacokinetic and physiological reference point only, derived from population averages, not an individualised health goal.`,
    keywords: ['ideal body weight calculator', 'Devine formula calculator', 'drug dosing weight calculator'],
  },

  // 16. Body Surface Area
  {
    slug: 'body-surface-area',
    name: 'Body Surface Area (BSA) Calculator',
    shortName: 'BSA',
    category: 'General',
    description: 'Calculates body surface area for chemotherapy dosing and burns assessment.',
    tier: 'free',
    fields: [
      { id: 'heightCm', label: 'Height', type: 'number', unit: 'cm', min: 30, max: 250 },
      { id: 'weightKg', label: 'Weight', type: 'number', unit: 'kg', step: 0.1, min: 1, max: 300 },
    ],
    calculate: (inputs) => {
      const h = Number(inputs.heightCm);
      const w = Number(inputs.weightKg);
      const bsa = Math.sqrt((h * w) / 3600);
      const roundedBsa = Math.round(bsa * 100) / 100;
      return {
        value: roundedBsa,
        unit: 'm²',
        interpretation: `Mosteller formula. Used for chemotherapy dosing (mg/m²) and burns/fluid resuscitation calculations. Average adult BSA is approximately 1.7 m².`,
        severity: 'neutral',
      };
    },
    reference: 'Mosteller RD. Simplified calculation of body surface area. N Engl J Med. 1987.',
    clinicalGuide: `Body surface area (BSA), most commonly calculated using the Mosteller formula for its simplicity and accuracy, is the standard dosing variable for chemotherapy agents, replacing weight-based dosing because BSA correlates more closely with metabolic rate, cardiac output, and drug clearance than weight alone — two patients of very different weight but similar height and build often have surprisingly similar BSA, and therefore similar appropriate drug exposure. Chemotherapy protocols specify doses in mg/m², and an error in BSA calculation directly and proportionally changes the cytotoxic drug dose delivered, making accuracy here higher-stakes than in most other calculator contexts — many oncology centres double-check BSA calculations or have them verified by a second clinician or pharmacist before chemotherapy is prescribed. BSA is capped at a "BSA cap" in some protocols for patients above a certain body surface area (commonly 2.0–2.2 m²) to avoid excessive absolute doses in very large patients, since the linear mg/m² relationship doesn't always hold at extremes — local oncology protocols vary on whether and how to apply a cap. Beyond oncology, BSA is also used in burns management to estimate fluid resuscitation requirements via formulas like the Parkland formula, and in paediatrics for some drug dosing and cardiac index calculations (cardiac output divided by BSA, since absolute cardiac output scales with body size). Other BSA formulas exist (Du Bois, Haycock, Boyd) with minor differences in derivation population and accuracy at extremes of size — Mosteller is generally preferred for its simplicity and comparable accuracy to the more complex Du Bois formula across most adult body sizes.`,
    keywords: ['body surface area calculator', 'BSA calculator', 'Mosteller formula calculator', 'chemotherapy dosing calculator'],
  },

  // 17. Paediatric Weight-Based Dose
  {
    slug: 'pediatric-dose',
    name: 'Paediatric Weight-Based Dose Calculator',
    shortName: 'Paeds dose',
    category: 'Paediatrics',
    description: 'Calculates a weight-based drug dose and checks it against a maximum adult dose.',
    tier: 'free',
    fields: [
      { id: 'weightKg', label: 'Child weight', type: 'number', unit: 'kg', step: 0.1, min: 1, max: 100 },
      { id: 'doseMgPerKg', label: 'Dose', type: 'number', unit: 'mg/kg', step: 0.1, min: 0.01, max: 100 },
      { id: 'maxDoseMg', label: 'Maximum single dose (per drug reference)', type: 'number', unit: 'mg', step: 1, min: 1, max: 5000, placeholder: 'e.g. 1000 for paracetamol' },
    ],
    calculate: (inputs) => {
      const weight = Number(inputs.weightKg);
      const dosePerKg = Number(inputs.doseMgPerKg);
      const maxDose = Number(inputs.maxDoseMg);
      const calculatedDose = Math.round(weight * dosePerKg * 100) / 100;
      const finalDose = Math.min(calculatedDose, maxDose);
      const wasCapped = calculatedDose > maxDose;

      return {
        value: finalDose,
        unit: 'mg',
        interpretation: wasCapped
          ? `Weight-based calculation gave ${calculatedDose} mg, but this exceeds the maximum dose entered — capped at ${maxDose} mg. Always verify against your local paediatric formulary.`
          : `Weight-based dose of ${calculatedDose} mg is within the maximum dose limit entered. Always verify against your local paediatric formulary (e.g. BNFc) before prescribing.`,
        severity: wasCapped ? 'moderate' : 'low',
      };
    },
    reference: 'Standard weight-based dosing methodology. Always verify against current BNFc / institutional paediatric formulary.',
    clinicalGuide: `Paediatric drug dosing is overwhelmingly weight-based (mg/kg) rather than fixed-dose, because children's body composition, organ maturity, and drug clearance vary enormously across the weight range from a 3kg neonate to a 70kg teenager — a fixed adult dose would be wildly inappropriate at the lower end, and weight scales far better than age alone, since two five-year-olds can differ in weight by a factor of two. This calculator performs the basic multiplication (weight × mg/kg dose) and checks the result against a maximum single dose ceiling, because many drugs have a mg/kg recommendation that, taken literally, would exceed the typical adult dose in a large child or teenager — paracetamol is the classic example, where 15 mg/kg in a 90kg adolescent would exceed the standard adult maximum single dose, and the lower of the two calculations should always be used. This tool is a calculation aid only, not a replacement for an authoritative paediatric formulary (BNFc in the UK, Lexicomp Paediatric or similar elsewhere) — mg/kg doses, maximum doses, dosing intervals, and age-based restrictions vary by drug, indication, and local protocol, and should always be looked up fresh rather than relied on from memory, even by experienced paediatric prescribers. Double-checking paediatric drug calculations is standard practice precisely because decimal point and unit errors here have a narrower margin for error than in adults — a calculation should ideally be independently verified by a second clinician or pharmacist for high-risk drugs (insulin, opioids, chemotherapy, anticoagulants) regardless of how confident the prescriber is in their arithmetic.`,
    keywords: ['pediatric dose calculator', 'paediatric drug dose calculator', 'weight based dosing calculator', 'child dose calculator'],
  },

  // 18. Serum Osmolality / Osmolar Gap
  {
    slug: 'osmolar-gap',
    name: 'Osmolar Gap Calculator',
    shortName: 'Osmolar gap',
    category: 'Metabolic',
    description: 'Calculates calculated osmolality and the osmolar gap — useful in suspected toxic alcohol ingestion.',
    tier: 'free',
    fields: [
      { id: 'sodium', label: 'Sodium', type: 'number', unit: 'mmol/L', min: 100, max: 180 },
      { id: 'glucose', label: 'Glucose', type: 'number', unit: 'mg/dL', min: 10, max: 1500 },
      { id: 'urea', label: 'BUN (urea nitrogen)', type: 'number', unit: 'mg/dL', min: 1, max: 300 },
      { id: 'measuredOsm', label: 'Measured serum osmolality (from lab)', type: 'number', unit: 'mOsm/kg', min: 200, max: 450 },
      { id: 'ethanol', label: 'Ethanol level (optional)', type: 'number', unit: 'mg/dL', min: 0, max: 600, placeholder: 'leave blank if not tested' },
    ],
    calculate: (inputs) => {
      const na = Number(inputs.sodium);
      const glucose = Number(inputs.glucose);
      const bun = Number(inputs.urea);
      const measured = Number(inputs.measuredOsm);
      const ethanol = inputs.ethanol ? Number(inputs.ethanol) : 0;

      const calculated = 2 * na + glucose / 18 + bun / 2.8 + ethanol / 3.7;
      const roundedCalc = Math.round(calculated * 10) / 10;
      const gap = Math.round((measured - roundedCalc) * 10) / 10;

      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (gap > 10) { interpretation = 'Elevated osmolar gap (>10). Consider toxic alcohol ingestion: methanol, ethylene glycol, isopropyl alcohol, or unmeasured osmotically active substances.'; severity = 'high'; }
      else { interpretation = 'Normal osmolar gap. Toxic alcohol ingestion less likely, though a normal gap cannot fully exclude it, especially if the alcohol has already been metabolised.'; severity = 'low'; }

      return {
        value: gap,
        unit: 'mOsm/kg',
        interpretation,
        severity,
        breakdown: [{ label: 'Calculated osmolality', value: roundedCalc }, { label: 'Measured osmolality', value: measured }],
      };
    },
    reference: 'Standard toxicology formula. Glasser L et al. Osmolal gap. Am J Clin Pathol. 1973.',
    clinicalGuide: `The osmolar gap is the difference between measured serum osmolality (from the lab, by freezing point depression) and calculated osmolality (derived from sodium, glucose, and urea, with ethanol included if measured). A gap above roughly 10 mOsm/kg suggests the presence of an osmotically active substance not captured in the calculation — classically a toxic alcohol such as methanol, ethylene glycol, or isopropyl alcohol, but also seen with mannitol, severe ketoacidosis, or lab artefact from lipaemia or hyperproteinaemia. This calculator is most useful in suspected toxic alcohol poisoning, where rapid identification matters because methanol and ethylene glycol both require urgent treatment (fomepizole or ethanol, plus consideration of haemodialysis) before specific levels return from a reference lab, which can take hours. A critical limitation: a normal osmolar gap does NOT reliably exclude toxic alcohol ingestion, especially if time has passed and the parent alcohol has already been partially metabolised into its toxic, lower-osmolality metabolites (formic acid from methanol, glycolic/oxalic acid from ethylene glycol) — these metabolites drive the anion gap acidosis without contributing as much to the osmolar gap, meaning a patient can have a normal osmolar gap but a severely elevated anion gap and be critically unwell from toxic alcohol ingestion. For this reason, clinical suspicion based on history and the combination of anion gap acidosis plus any osmolar gap elevation should drive urgent treatment decisions, not osmolar gap calculation in isolation. Concurrent ethanol level must be factored into the calculation, since ethanol itself raises measured osmolality substantially and would otherwise be misread as an unexplained gap.`,
    keywords: ['osmolar gap calculator', 'osmolality calculator', 'toxic alcohol calculator', 'methanol ethylene glycol calculator'],
  },

  // 19. SOFA Score (Pro)
  {
    slug: 'sofa-score',
    name: 'SOFA Score Calculator',
    shortName: 'SOFA',
    category: 'Critical Care',
    description: 'Sequential Organ Failure Assessment — quantifies organ dysfunction severity in critical illness.',
    tier: 'pro',
    fields: [
      { id: 'pao2fio2', label: 'PaO₂/FiO₂ ratio (mmHg)', type: 'select', options: [{ label: '≥400', value: 0 }, { label: '300-399', value: 1 }, { label: '200-299', value: 2 }, { label: '100-199 (with resp support)', value: 3 }, { label: '<100 (with resp support)', value: 4 }] },
      { id: 'platelets', label: 'Platelets (×10³/µL)', type: 'select', options: [{ label: '≥150', value: 0 }, { label: '100-149', value: 1 }, { label: '50-99', value: 2 }, { label: '20-49', value: 3 }, { label: '<20', value: 4 }] },
      { id: 'bilirubin', label: 'Bilirubin (mg/dL)', type: 'select', options: [{ label: '<1.2', value: 0 }, { label: '1.2-1.9', value: 1 }, { label: '2.0-5.9', value: 2 }, { label: '6.0-11.9', value: 3 }, { label: '≥12.0', value: 4 }] },
      { id: 'cardiovascular', label: 'Cardiovascular (MAP / vasopressor requirement)', type: 'select', options: [{ label: 'MAP ≥70 mmHg', value: 0 }, { label: 'MAP <70 mmHg', value: 1 }, { label: 'Dopamine ≤5 or any dobutamine', value: 2 }, { label: 'Dopamine >5, or norepi/epi ≤0.1', value: 3 }, { label: 'Dopamine >15, or norepi/epi >0.1', value: 4 }] },
      { id: 'gcs', label: 'Glasgow Coma Scale', type: 'select', options: [{ label: '15', value: 0 }, { label: '13-14', value: 1 }, { label: '10-12', value: 2 }, { label: '6-9', value: 3 }, { label: '<6', value: 4 }] },
      { id: 'creatinine', label: 'Creatinine (mg/dL) or urine output', type: 'select', options: [{ label: '<1.2', value: 0 }, { label: '1.2-1.9', value: 1 }, { label: '2.0-3.4', value: 2 }, { label: '3.5-4.9 or UO <500mL/day', value: 3 }, { label: '≥5.0 or UO <200mL/day', value: 4 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (score <= 1) { interpretation = 'Minimal organ dysfunction. Mortality risk <10%.'; severity = 'low'; }
      else if (score <= 5) { interpretation = 'Mild-moderate organ dysfunction. Mortality risk ~10-20%.'; severity = 'moderate'; }
      else if (score <= 9) { interpretation = 'Significant organ dysfunction. Mortality risk ~20-40%.'; severity = 'high'; }
      else { interpretation = 'Severe multi-organ dysfunction. Mortality risk >40-50%.'; severity = 'critical'; }
      return { value: score, unit: '/24', interpretation, severity };
    },
    reference: 'Vincent JL et al. The SOFA score. Intensive Care Med. 1996. Used in Sepsis-3 definition.',
    clinicalGuide: `The Sequential Organ Failure Assessment (SOFA) score quantifies the degree of dysfunction across six organ systems — respiratory, coagulation, hepatic, cardiovascular, neurological, and renal — each scored 0–4, for a total of 0–24. It was originally designed to track organ dysfunction trends over time in ICU patients rather than as a single-point mortality predictor, and serial SOFA scores (the change over 48–72 hours) often carry more prognostic value than any single measurement, since a worsening trend signals deteriorating physiology even before absolute thresholds are crossed. SOFA gained prominence as the basis for the Sepsis-3 definition, where sepsis is defined as suspected infection plus an acute increase in SOFA score of 2 or more points, replacing the older SIRS-criteria-based definition — this shifted the clinical definition of sepsis toward organ dysfunction rather than the systemic inflammatory response alone, which had poor specificity. qSOFA (quick SOFA — altered mentation, respiratory rate ≥22, systolic BP ≤100) is a simplified bedside screening tool derived from SOFA, intended to flag patients who warrant fuller assessment, not to diagnose sepsis itself; it should not be confused with full SOFA, which requires laboratory values. Calculating full SOFA requires arterial blood gas (for PaO₂/FiO₂), platelet count, bilirubin, creatinine or urine output, GCS, and current vasopressor doses — meaning it cannot be done from vital signs alone the way qSOFA can. As with most ICU severity scores, SOFA describes population-level risk and should never be used in isolation to guide individual treatment-limitation or end-of-life discussions; it complements but does not replace overall clinical judgement, patient trajectory, comorbidities, and goals of care.`,
    keywords: ['SOFA score calculator', 'sepsis SOFA calculator', 'organ failure assessment score'],
  },

  // 20. CRB-65 (simplified CURB without urea, useful in primary care)
  {
    slug: 'crb-65',
    name: 'CRB-65 Pneumonia Severity Score',
    shortName: 'CRB-65',
    category: 'Respiratory',
    description: 'Simplified pneumonia severity score for use without blood tests, e.g. in primary care.',
    tier: 'free',
    fields: [
      { id: 'confusion', label: 'New confusion', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'respRate', label: 'Respiratory rate ≥30/min', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'bp', label: 'BP: systolic <90 or diastolic ≤60 mmHg', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
      { id: 'age65', label: 'Age ≥65', type: 'radio', options: [{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }] },
    ],
    calculate: (inputs) => {
      const score = Object.values(inputs).reduce((sum: number, v) => sum + Number(v), 0);
      let interpretation = '';
      let severity: 'low' | 'moderate' | 'high' = 'low';
      if (score === 0) { interpretation = 'Low risk (~1.2% mortality). Outpatient treatment appropriate.'; severity = 'low'; }
      else if (score <= 2) { interpretation = 'Moderate risk (~8.15% mortality). Consider hospital referral.'; severity = 'moderate'; }
      else { interpretation = 'High risk (~31% mortality). Urgent hospital admission.'; severity = 'high'; }
      return { value: score, unit: 'points', interpretation, severity };
    },
    reference: 'Lim WS et al. Defining community acquired pneumonia severity. Thorax. 2003.',
    clinicalGuide: `CRB-65 is the primary-care-friendly variant of CURB-65, omitting the urea measurement so it can be calculated entirely at the bedside without blood tests — useful in GP surgeries, urgent care, and home visits where lab results aren't immediately available. The four remaining criteria — confusion, respiratory rate ≥30, blood pressure (systolic <90 or diastolic ≤60), and age ≥65 — are each worth one point, giving a score of 0–4. A score of 0 supports safe outpatient management; 1–2 suggests considering hospital referral, factoring in social circumstances and comorbidities; 3 or more indicates urgent hospital admission. Because it omits urea, CRB-65 is slightly less discriminating than full CURB-65 and tends to under-triage some patients who have significant renal impairment contributing to severity but otherwise normal vital signs — when blood tests are available, CURB-65 should be preferred. NICE guidance explicitly recommends CRB-65 in primary care settings and CURB-65 in hospital settings where bloods are routinely available, reflecting this practical distinction rather than a difference in which score is "more correct." As with CURB-65, the score should never be used to override clinical gestalt — a frail, multimorbid patient scoring 0 might still warrant admission for safety netting, monitoring, or social reasons, and conversely a robust, well-supported patient scoring 1 with reliable follow-up may be safely managed in the community with a clear safety net and explicit return advice.`,
    keywords: ['CRB-65 calculator', 'pneumonia score primary care', 'CRB65 pneumonia severity'],
  },
];
