import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const AWS = require('aws-sdk');
const Sharp = require('sharp');

const S3 = new AWS.S3();

const DEST_BUCKET = 'imgprocessingresized1'; //Should Match the exact name of destination

exports.handler = async (event) => {
  const record = event.Records[0];
  const srcBucket = record.s3.bucket.name;
  const srcKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  const path = require('path');

  const dstKey = path.basename(srcKey);

  try {
    const originalImage = await S3.getObject({ Bucket: srcBucket, Key: srcKey }).promise();

    // Resizes the images to 512x512
    const resizedImage = await Sharp(originalImage.Body)
      .resize(512,512)
      .toBuffer();

      console.log('Resized image size:', resizedImage.length);
      console.log('Uploading to:', dstKey);

    await S3.putObject({
      Bucket: DEST_BUCKET,
      Key: dstKey,
      Body: resizedImage,
      ContentType: 'image/png',
    }).promise();

    console.log(`Image ${srcKey} sucessfully processed and stored in: ${DEST_BUCKET}/${dstKey}`);
  } catch (err) {
    console.error('Error processing image:', err);
    throw err;
  }
};