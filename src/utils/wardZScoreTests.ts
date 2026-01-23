/**
 * Z-Score Ward Classification Test Suite
 * 
 * This file tests the Z-score classification logic against the specified test cases:
 * 
 * Test Case 1 – Tie Handling: [50, 50, 20, 10] - Same scores should get same labels
 * Test Case 2 – Clustered Values: [100, 99, 98, 97] - No ward should be marked High
 * Test Case 3 – Real Outlier: [10, 12, 11, 500] - 500-report ward should be High
 */

import {
    computeWardZScores,
    WardInput,
    WardStats,
    WardSeverity
} from './wardZScoreUtils';

interface TestResult {
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
    details?: string;
}

function runTests(): TestResult[] {
    const results: TestResult[] = [];

    // Test Case 1: Tie Handling
    // Input: 50, 50, 20, 10
    // Expected: Both 50-report wards → same color and label
    const testCase1Input: WardInput[] = [
        { ward_id: 1, name: 'Ward A', reports: 50 },
        { ward_id: 2, name: 'Ward B', reports: 50 },
        { ward_id: 3, name: 'Ward C', reports: 20 },
        { ward_id: 4, name: 'Ward D', reports: 10 }
    ];

    const result1 = computeWardZScores(testCase1Input);
    const ward1A = result1.wardStats.find(w => w.wardId === 1);
    const ward1B = result1.wardStats.find(w => w.wardId === 2);

    results.push({
        name: 'Test Case 1: Tie Handling - Same Z-scores',
        passed: ward1A?.zScore === ward1B?.zScore,
        expected: 'Z-scores should be identical',
        actual: `Ward A Z=${ward1A?.zScore}, Ward B Z=${ward1B?.zScore}`,
        details: 'Wards with same report count should have identical Z-scores'
    });

    results.push({
        name: 'Test Case 1: Tie Handling - Same Severity',
        passed: ward1A?.severity === ward1B?.severity,
        expected: 'Severity labels should be identical',
        actual: `Ward A severity=${ward1A?.severity}, Ward B severity=${ward1B?.severity}`
    });

    // Test Case 2: Clustered Values
    // Input: 100, 99, 98, 97
    // Expected: No ward marked High, all get similar severity
    const testCase2Input: WardInput[] = [
        { ward_id: 1, name: 'Ward A', reports: 100 },
        { ward_id: 2, name: 'Ward B', reports: 99 },
        { ward_id: 3, name: 'Ward C', reports: 98 },
        { ward_id: 4, name: 'Ward D', reports: 97 }
    ];

    const result2 = computeWardZScores(testCase2Input);
    const highSeverityCount = result2.wardStats.filter(w => w.severity === 'HIGH').length;

    results.push({
        name: 'Test Case 2: Clustered Values - No HIGH severity',
        passed: highSeverityCount === 0,
        expected: 'No wards should be marked HIGH',
        actual: `Found ${highSeverityCount} HIGH severity wards`,
        details: JSON.stringify(result2.wardStats.map(w => ({ name: w.wardName, z: w.zScore, severity: w.severity })))
    });

    // Verify that clustered values have similar severities
    const severities2 = new Set(result2.wardStats.map(w => w.severity));
    results.push({
        name: 'Test Case 2: Clustered Values - Similar severities',
        passed: severities2.size <= 2, // Should be mostly MEDIUM and LOW
        expected: 'At most 2 different severity levels',
        actual: `Found ${severities2.size} different severities: ${Array.from(severities2).join(', ')}`
    });

    // Test Case 3: Real Outlier
    // Input: 10, 12, 11, 500
    // Expected: 500-report ward → High, Others → Low
    const testCase3Input: WardInput[] = [
        { ward_id: 1, name: 'Ward A', reports: 10 },
        { ward_id: 2, name: 'Ward B', reports: 12 },
        { ward_id: 3, name: 'Ward C', reports: 11 },
        { ward_id: 4, name: 'Ward Outlier', reports: 500 }
    ];

    const result3 = computeWardZScores(testCase3Input);
    const outlierWard = result3.wardStats.find(w => w.wardId === 4);
    const nonOutlierWards = result3.wardStats.filter(w => w.wardId !== 4);

    results.push({
        name: 'Test Case 3: Real Outlier - 500-report ward is HIGH',
        passed: outlierWard?.severity === 'HIGH',
        expected: '500-report ward should be HIGH',
        actual: `Outlier ward severity=${outlierWard?.severity}, Z=${outlierWard?.zScore}`,
        details: `Mean: ${result3.metrics.mean}, StdDev: ${result3.metrics.standardDeviation}`
    });

    results.push({
        name: 'Test Case 3: Real Outlier - Other wards are LOW',
        passed: nonOutlierWards.every(w => w.severity === 'LOW'),
        expected: 'Other wards should be LOW',
        actual: nonOutlierWards.map(w => `${w.wardName}: ${w.severity}`).join(', ')
    });

    // Edge Case: Zero Variance
    const zeroVarianceInput: WardInput[] = [
        { ward_id: 1, name: 'Ward A', reports: 50 },
        { ward_id: 2, name: 'Ward B', reports: 50 },
        { ward_id: 3, name: 'Ward C', reports: 50 }
    ];

    const zeroVarianceResult = computeWardZScores(zeroVarianceInput);
    const allZeroScores = zeroVarianceResult.wardStats.every(w => w.zScore === 0);

    results.push({
        name: 'Edge Case: Zero Variance - All Z-scores are 0',
        passed: allZeroScores,
        expected: 'All Z-scores should be 0',
        actual: zeroVarianceResult.wardStats.map(w => `${w.wardName}: Z=${w.zScore}`).join(', ')
    });

    results.push({
        name: 'Edge Case: Zero Variance - Standard deviation is 0',
        passed: zeroVarianceResult.metrics.standardDeviation === 0,
        expected: 'Standard deviation should be 0',
        actual: `StdDev = ${zeroVarianceResult.metrics.standardDeviation}`
    });

    // Edge Case: Empty input
    const emptyResult = computeWardZScores([]);
    results.push({
        name: 'Edge Case: Empty Input',
        passed: emptyResult.wardStats.length === 0 && emptyResult.metrics.wardCount === 0,
        expected: 'Empty results',
        actual: `WardStats length: ${emptyResult.wardStats.length}, WardCount: ${emptyResult.metrics.wardCount}`
    });

    return results;
}

// Run tests and display results
export function validateZScoreImplementation(): void {
    console.log('\n=== Z-Score Ward Classification Tests ===\n');

    const results = runTests();
    let passedCount = 0;
    let failedCount = 0;

    results.forEach((result, index) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${index + 1}. ${result.name}`);
        console.log(`   ${status}`);
        console.log(`   Expected: ${result.expected}`);
        console.log(`   Actual: ${result.actual}`);
        if (result.details) {
            console.log(`   Details: ${result.details}`);
        }
        console.log('');

        if (result.passed) {
            passedCount++;
        } else {
            failedCount++;
        }
    });

    console.log('=== Summary ===');
    console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
    console.log('');
}

// Export test results for programmatic access
export function getTestResults(): TestResult[] {
    return runTests();
}
