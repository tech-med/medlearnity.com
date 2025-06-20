#!/usr/bin/env node
// scripts/test-helpers.js
// Basic smoke tests for Node helper scripts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const tests = [
	{
		name: 'Smart Upload Blobs (dry run)',
		command: 'node scripts/smart-upload-blobs.js --dry-run',
		timeout: 10000,
	},
	{
		name: 'YAML Validation',
		command: 'node scripts/validate-yaml-frontmatter.js',
		timeout: 15000,
	},
	{
		name: 'Count Blobs',
		command: 'node scripts/count-blobs.js',
		timeout: 5000,
	},
];

async function runTest(test) {
	try {
		console.log(`🧪 Testing: ${test.name}`);

		const { stderr } = await execAsync(test.command, {
			timeout: test.timeout,
		});

		if (stderr && !stderr.includes('Warning')) {
			throw new Error(stderr);
		}

		console.log(`✅ ${test.name} - PASSED`);
		return true;
	} catch (error) {
		console.error(`❌ ${test.name} - FAILED`);
		console.error(`   Error: ${error.message}`);
		return false;
	}
}

async function main() {
	console.log('🚀 Running Node Helper Smoke Tests\n');

	let passed = 0;
	let failed = 0;

	for (const test of tests) {
		const success = await runTest(test);
		if (success) {
			passed++;
		} else {
			failed++;
		}
		console.log('');
	}

	console.log(`📊 Test Results:`);
	console.log(`   ✅ Passed: ${passed}`);
	console.log(`   ❌ Failed: ${failed}`);
	console.log(`   📁 Total: ${tests.length}`);

	if (failed > 0) {
		console.log('\n💡 Some tests failed. Check the errors above.');
		process.exit(1);
	} else {
		console.log('\n🎉 All tests passed!');
	}
}

main().catch((error) => {
	console.error('❌ Test runner failed:', error.message);
	process.exit(1);
});
