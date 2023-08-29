# Slack Ping
>>The aim of this particular template is to send a slack notification for each completed
> CircleCi run completion. It will help create more visibility of passing/failing/skipped tests 
> by extracting this from the Allure report and submitting the URLS within the notification.

# How To use
1. In your project, ensure you have allure reporting enabled. 
2. Create a Python script in your repository. Name it something like `slack_notification.py`
3. The python script should executable. You can do that by running `chmod +x send_slack_notification.py`
4. Update your CircleCi config.yml by adding: <br>
>`- run:` <br>
          `name: Send Slack notification` <br>
          `command: ./slack_notification.py` <br>
          `when: always`
