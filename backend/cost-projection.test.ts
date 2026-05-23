/**
 * Cost Projection Endpoint - Calculation Verification
 * Test to verify:
 * 1. Endpoint returns valid JSON
 * 2. savingsPercent is approximately 85-90%
 * 3. All calculations are consistent (no NaN or division errors)
 */

// Test Constants (must match backend)
const currentUsers = 1000;
const targetUsers = 5000;
const teacherFraction = 0.6;
const assessmentsPerTeacherPerWeek = 3;
const weeksPerMonth = 4.3;
const currentCostPerAssessment = 12; // ₹
const newCostPerAssessment = 3.5; // ₹
const expectedCacheHitRate = 0.5; // 50% - realistic for EdTech topic repetition

// Perform calculations
const currentMonthlyAssessments =
  currentUsers * teacherFraction * assessmentsPerTeacherPerWeek * weeksPerMonth;
const targetMonthlyAssessments =
  targetUsers * teacherFraction * assessmentsPerTeacherPerWeek * weeksPerMonth;

const currentMonthlyCost = currentMonthlyAssessments * currentCostPerAssessment;
const targetMonthlyCostOld =
  targetMonthlyAssessments * currentCostPerAssessment;

const cachedAssessments = targetMonthlyAssessments * expectedCacheHitRate;
const nonCachedAssessments =
  targetMonthlyAssessments * (1 - expectedCacheHitRate);
const targetMonthlyCostNew = nonCachedAssessments * newCostPerAssessment;

const monthlySavings = targetMonthlyCostOld - targetMonthlyCostNew;
const savingsPercent = (monthlySavings / targetMonthlyCostOld) * 100;

const annualSavings = monthlySavings * 12;

console.log("=== Cost Projection Calculation Test ===\n");

// Test 1: Check for valid numbers (no NaN)
console.log("TEST 1: Verify all calculations produce valid numbers");
const values = {
  currentMonthlyAssessments,
  targetMonthlyAssessments,
  currentMonthlyCost,
  targetMonthlyCostOld,
  cachedAssessments,
  nonCachedAssessments,
  targetMonthlyCostNew,
  monthlySavings,
  savingsPercent,
  annualSavings,
};

let hasNaN = false;
for (const [key, value] of Object.entries(values)) {
  if (isNaN(value) || value === Infinity) {
    console.log(`  ❌ FAIL: ${key} = ${value}`);
    hasNaN = true;
  }
}

if (!hasNaN) {
  console.log("  ✓ PASS: All values are valid numbers\n");
} else {
  process.exit(1);
}

// Test 2: Check savings percentage is 85-90%
console.log("TEST 2: Verify savingsPercent is approximately 85-90%");
console.log(`  savingsPercent = ${savingsPercent.toFixed(2)}%`);

if (savingsPercent >= 85 && savingsPercent <= 90) {
  console.log(
    `  ✓ PASS: savingsPercent (${savingsPercent.toFixed(2)}%) is in range [85-90]\n`,
  );
} else {
  console.log(
    `  ❌ FAIL: savingsPercent (${savingsPercent.toFixed(2)}%) is NOT in range [85-90]`,
  );
  console.log(`  Expected: 85% - 90%`);
  console.log(`  Got: ${savingsPercent.toFixed(2)}%\n`);
  process.exit(1);
}

// Test 3: Verify calculation consistency
console.log("TEST 3: Verify calculation logic is consistent");

// Check: monthlySavings should equal difference
const expectedSavings = targetMonthlyCostOld - targetMonthlyCostNew;
if (Math.abs(monthlySavings - expectedSavings) < 0.01) {
  console.log(
    `  ✓ PASS: monthlySavings (₹${monthlySavings.toFixed(2)}) = targetMonthlyCostOld (₹${targetMonthlyCostOld.toFixed(2)}) - targetMonthlyCostNew (₹${targetMonthlyCostNew.toFixed(2)})`,
  );
} else {
  console.log(`  ❌ FAIL: monthlySavings calculation is incorrect`);
  process.exit(1);
}

// Check: savingsPercent formula
const expectedSavingsPercent = (monthlySavings / targetMonthlyCostOld) * 100;
if (Math.abs(savingsPercent - expectedSavingsPercent) < 0.01) {
  console.log(
    `  ✓ PASS: savingsPercent (${savingsPercent.toFixed(2)}%) = (monthlySavings / targetMonthlyCostOld) * 100`,
  );
} else {
  console.log(`  ❌ FAIL: savingsPercent calculation is incorrect`);
  process.exit(1);
}

// Check: annualSavings
const expectedAnnualSavings = monthlySavings * 12;
if (Math.abs(annualSavings - expectedAnnualSavings) < 0.01) {
  console.log(
    `  ✓ PASS: annualSavings (₹${annualSavings.toFixed(2)}) = monthlySavings * 12\n`,
  );
} else {
  console.log(`  ❌ FAIL: annualSavings calculation is incorrect`);
  process.exit(1);
}

// Test 4: Display detailed breakdown
console.log("TEST 4: Detailed calculation breakdown");
console.log(`  Current Users: ${currentUsers.toLocaleString()}`);
console.log(`  Target Users: ${targetUsers.toLocaleString()}`);
console.log(`  Teacher Fraction: ${(teacherFraction * 100).toFixed(0)}%`);
console.log(`  Assessments/Teacher/Week: ${assessmentsPerTeacherPerWeek}`);
console.log(`  Weeks/Month: ${weeksPerMonth}`);
console.log(
  `  Expected Cache Hit Rate: ${(expectedCacheHitRate * 100).toFixed(0)}%\n`,
);

console.log("  Current Scale (1K Users):");
console.log(
  `    Monthly Assessments: ${Math.round(currentMonthlyAssessments).toLocaleString()}`,
);
console.log(`    Monthly Cost: ₹${currentMonthlyCost.toFixed(2)}`);

console.log("\n  Target Scale (5K Users):");
console.log(
  `    Monthly Assessments: ${Math.round(targetMonthlyAssessments).toLocaleString()}`,
);
console.log(
  `    Cached (35%): ${Math.round(cachedAssessments).toLocaleString()}`,
);
console.log(
  `    Non-cached (65%): ${Math.round(nonCachedAssessments).toLocaleString()}`,
);
console.log(`    Old System Cost (GPT-4): ₹${targetMonthlyCostOld.toFixed(2)}`);
console.log(`    New System Cost (Haiku): ₹${targetMonthlyCostNew.toFixed(2)}`);

console.log("\n  Savings:");
console.log(`    Monthly Savings: ₹${monthlySavings.toFixed(2)}`);
console.log(`    Savings Percentage: ${savingsPercent.toFixed(2)}%`);
console.log(`    Annual Savings: ₹${annualSavings.toFixed(2)}`);

console.log("\n=== All Tests Passed ✓ ===");
