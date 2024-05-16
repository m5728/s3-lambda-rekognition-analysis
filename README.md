Serverless Image Processing Workflow with AWS Lambda, Rekognition, DynamoDB, SNS and S3

This project demonstrates a serverless workflow for automatically analyzing images uploaded to an S3 bucket.

What it does:

Image Upload: Images are uploaded to a designated S3 bucket.
Lambda Trigger: The upload triggers a Lambda function.
Image Processing: The Lambda function:
Downloads the uploaded image.
Uses AWS Rekognition to identify objects or scenes within the image.
Stores the analysis results in a DynamoDB table.
Notification: The function can send an email notification via SNS to inform you about the new image and its analysis.

Benefits of Serverless:

Scalability: The serverless architecture automatically scales to handle any volume of uploads.
Cost-Effectiveness: You only pay for the resources used, making it cost-efficient for varying workloads.
Focus on Code: You can focus on developing the image processing logic without managing servers.
