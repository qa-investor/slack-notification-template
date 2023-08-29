import fetch from 'node-fetch';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config();

const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL'
const CHANNEL = '#YOUR_SLACK_CHANNEL';

const status = process.env.CIRCLE_JOB_OUTCOME;
let text = '';
if (status === 'failed') {
    text = `:red_circle: Build failed on branch: ${process.env.CIRCLE_BRANCH}`;
} else {
    text = `:large_green_circle: Build succeeded on branch: ${process.env.CIRCLE_BRANCH}`;
}

const allure_results_path = 'allure-report/data/behaviors.csv';

const test_counts = {
    'Total Tests': 0,
    'Passed': 0,
    'Failures': 0,
    'Skipped': 0
};

fs.createReadStream(allure_results_path, { encoding: 'utf-8' })
    .pipe(csv())
    .on('data', (row) => {
        test_counts['Passed'] += parseInt(row['PASSED']);
        test_counts['Failures'] += parseInt(row['FAILED']);
        test_counts['Skipped'] += parseInt(row['SKIPPED']);
    })
    .on('end', () => {
        test_counts['Total Tests'] = test_counts['Passed'] + test_counts['Failures'] + test_counts['Skipped'];
        const success_rate = (test_counts['Passed'] / test_counts['Total Tests']) * 100 || 0;

        text += `\n\n*Total Tests:* ${test_counts['Total Tests']}`;
        text += `\n\n*Passed:* ${test_counts['Passed']}`;
        text += `\n\n*Failures:* ${test_counts['Failures']}`;
        text += `\n\n*Skipped:* ${test_counts['Skipped']}`;
        text += `\n\n*Success Rate:* ${success_rate.toFixed(2)}%`;

        const allure_report_url = `https://output.circle-artifacts.com/output/job/${process.env.CIRCLE_WORKFLOW_JOB_ID}/artifacts/0/allure-report/index.html`;
        text += `\n\n*Build Allure Report:* <${allure_report_url}|Click to view report>`;

        const circleci_job_url = process.env.CIRCLE_BUILD_URL;
        text += `\n\n*Build Job:* <${circleci_job_url}|Click to view Job>`;

        const payload = {
            'channel': CHANNEL,
            'text': text
        };

        const headers = {
            'Content-Type': 'application/json'
        };

        fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (response.status === 200) {
                    console.log('Slack notification sent successfully.');
                } else {
                    console.log('Failed to send Slack notification.');
                }
            })
            .catch(error => {
                console.error('Error sending Slack notification:', error);
            });
    });
