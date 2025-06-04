let handlerFn: typeof import('./index').handler;
let parser: typeof import('aws-lambda-multipart-parser');
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('aws-lambda-multipart-parser');
jest.mock('@aws-sdk/client-s3');

const sendMock = jest.fn();

describe('assets-api handler', () => {
  beforeEach(() => {
    jest.resetModules();
    sendMock.mockReset();
    parser = require('aws-lambda-multipart-parser');
    (parser.parse as jest.Mock).mockReset();
    (S3Client as jest.Mock).mockImplementation(() => ({ send: sendMock }));
    (PutObjectCommand as jest.Mock).mockImplementation((args) => args);
    process.env.ASSETS_BUCKET_NAME = 'test-bucket';
    jest.spyOn(Date, 'now').mockReturnValue(123);
    handlerFn = require('./index').handler;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 500 when bucket not configured', async () => {
    delete process.env.ASSETS_BUCKET_NAME;
    const res = await handlerFn({} as any);
    expect(res.statusCode).toBe(500);
  });

  it('returns 400 for invalid body', async () => {
    const event = { isBase64Encoded: false } as unknown as APIGatewayProxyEvent;
    const res = await handlerFn(event);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when file missing', async () => {
    const event = { isBase64Encoded: true, body: 'data' } as unknown as APIGatewayProxyEvent;
    (parser.parse as jest.Mock).mockReturnValue({});
    const res = await handlerFn(event);
    expect(res.statusCode).toBe(400);
  });

  it('uploads file to s3 and returns url', async () => {
    const file = { filename: 'logo.png', content: Buffer.from('a'), contentType: 'image/png' };
    (parser.parse as jest.Mock).mockReturnValue({ file });
    const event = { isBase64Encoded: true, body: 'data' } as unknown as APIGatewayProxyEvent;

    const res = await handlerFn(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.url).toBe('s3://test-bucket/logos/123_logo.png');
  });

});
