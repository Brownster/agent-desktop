import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ConnectClient, StartChatContactCommand } from '@aws-sdk/client-connect';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const instanceId = process.env.CONNECT_INSTANCE_ID;
  const flowId = process.env.CHAT_FLOW_ID;
  if (!instanceId || !flowId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Not configured' }) };
  }
  const client = new ConnectClient({ region: process.env.AWS_REGION || 'us-east-1' });
  try {
    const result = await client.send(new StartChatContactCommand({
      InstanceId: instanceId,
      ContactFlowId: flowId,
      ParticipantDetails: { DisplayName: 'Agent' },
    }));
    return {
      statusCode: 200,
      body: JSON.stringify({ participantToken: result.ParticipantToken, contactId: result.ContactId }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to start chat' }) };
  }
}
