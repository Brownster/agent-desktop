import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as parser from 'aws-lambda-multipart-parser';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const bucket = process.env.ASSETS_BUCKET_NAME;
  const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  if (!bucket) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Bucket not configured' })
    };
  }

  if (!event.isBase64Encoded || !event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const parsed = parser.parse(event, true);
  const file = parsed.file;
  if (!file || !file.filename) {
    return { statusCode: 400, body: JSON.stringify({ error: 'File not provided' }) };
  }

  const key = `logos/${Date.now()}_${file.filename}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.content,
        ContentType: file.contentType,
      }),
    );
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Upload failed' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ url: `s3://${bucket}/${key}` })
  };
}
