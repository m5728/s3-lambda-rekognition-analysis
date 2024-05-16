import AWS from 'aws-sdk';


export const handler = async (event) => {
 if (!event || !event.Records || event.Records.length === 0) {
   console.error("Error: Missing event data or empty Records array");
   return;
 }
  const s3 = new AWS.S3({ region: 'yourRegion' });
 const rekognition = new AWS.Rekognition({ region: 'yourRegion' });
 const dynamodb = new AWS.DynamoDB({ region: 'yourRegion' });
 const sns = new AWS.SNS({ region: 'yourRegion' });


 try {
   const record = event.Records.pop();
   const originalBucket = 'yourBucketName';
   const originalKey = record.s3.object.key;


   const id = originalKey;


   const headObjectParams = { Bucket: originalBucket, Key: originalKey };
   const headObjectResponse = await s3.headObject(headObjectParams).promise();
   const objectSize = headObjectResponse.ContentLength;


   const originalImageData = await downloadOriginalImage(s3, originalBucket, originalKey);
   if (!originalImageData) {
     console.error("Error: Failed to download image data.");
     return;
   }


   const labels = await detectLabels(rekognition, originalImageData);


   const itemParams = {
     TableName: 'yourTableName',
     Item: {
       'ID': { S: id },
       'bucket': { S: originalBucket },
       'key': { S: originalKey },
       'size': { N: objectSize.toString() },
       ...(labels && { 'labels': { L: labels.map(label => ({ S: label.Name })) } }),
     },
   };


   await dynamodb.putItem(itemParams).promise();


   const message = `New image uploaded: ${originalBucket}/${originalKey}`;
   await sendEmailNotificationViaSNS(sns, 'yourSNSTopicArn', message);
 } catch (error) {
   console.error(`Error processing image: ${error}`);
 }
};


async function downloadOriginalImage(s3Client, bucketName, objectKey) {
 try {
   const getObjectParams = { Bucket: bucketName, Key: objectKey };
   const response = await s3Client.getObject(getObjectParams).promise();


   if (!response.Body) {
     console.error(`Error: Image data not found for ${bucketName}/${objectKey}`);
     return null;
   }


   if (Buffer.isBuffer(response.Body)) {
     return response.Body;
   }


   const chunks = [];
   for await (const chunk of response.Body) {
     chunks.push(chunk);
   }


   const buffer = Buffer.concat(chunks);
   return buffer;


 } catch (error) {
   console.error(`Error downloading original image: ${error}`);
   throw error;
 }
}


async function detectLabels(rekognitionClient, imageData) {
 if (!Buffer.isBuffer(imageData)) {
   console.error("Error: Image data is not a Buffer.");
   return null;
 }


 const detectLabelsParams = {
   Image: {
     Bytes: imageData,
   },
 };


 try {
   const response = await rekognitionClient.detectLabels(detectLabelsParams).promise();
   return response.Labels;
 } catch (error) {
   console.error(`Error detecting labels: ${error}`);
   return null;
 }
}


async function sendEmailNotificationViaSNS(snsClient, topicArn, message) {
 const publishParams = {
   TopicArn: topicArn,
   Message: message,
   MessageAttributes: {
     'MessageType': {
       DataType: 'String',
       StringValue: 'Transactional',
     },
   },
 };


 try {
   await snsClient.publish(publishParams).promise();
 } catch (error) {
   console.error(`Error sending email notification via SNS: ${error}`);
 }
}
