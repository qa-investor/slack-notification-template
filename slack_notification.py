import os
import json
import requests
import csv

SLACK_WEBHOOK_URL = "YOUR_SLACK_WEBHOOK_URL"
CHANNEL = "#YOUR_SLACK_CHANNEL"

status = os.getenv("CIRCLE_JOB_OUTCOME")
if status == "failed":
    text = f":red_circle: Build failed on branch: {os.getenv('CIRCLE_BRANCH')}"
else:
    text = f":large_green_circle: Build succeeded on branch: {os.getenv('CIRCLE_BRANCH')}"

allure_results_path = "allure-report/data/behaviors.csv"


test_counts = {
    "Total Tests": 0,
    "Passed": 0,
    "Failures": 0,
    "Skipped": 0
}

with open(allure_results_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        test_counts["Passed"] += int(row["PASSED"])
        test_counts["Failures"] += int(row["FAILED"])
        test_counts["Skipped"] += int(row["SKIPPED"])

test_counts["Total Tests"] = test_counts["Passed"] + test_counts["Failures"] + test_counts["Skipped"]
success_rate = (test_counts["Passed"] / test_counts["Total Tests"]) * 100 if test_counts["Total Tests"] > 0 else 0

text += f"\n\n*Total Tests:* {test_counts['Total Tests']}"
text += f"\n\n*Passed:* {test_counts['Passed']}"
text += f"\n\n*Failures:* {test_counts['Failures']}"
text += f"\n\n*Skipped:* {test_counts['Skipped']}"
text += f"\n\n*Success Rate:* {success_rate:.2f}%"

allure_report_url = f"https://output.circle-artifacts.com/output/job/{os.getenv('CIRCLE_WORKFLOW_JOB_ID')}/artifacts/0/allure-report/index.html"
text += f"\n\n*Build Allure Report:* <{allure_report_url}|Click to view report>"

circleci_job_url = os.getenv('CIRCLE_BUILD_URL')
text += f"\n\n*Build Job:* <{circleci_job_url}|Click to view Job>"

payload = {
    "channel": CHANNEL,
    "text": text
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(SLACK_WEBHOOK_URL, data=json.dumps(payload), headers=headers)

if response.status_code == 200:
    print("Slack notification sent successfully.")
else:
    print("Failed to send Slack notification.")
