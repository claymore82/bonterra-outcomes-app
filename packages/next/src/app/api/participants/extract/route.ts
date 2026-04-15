import { NextRequest } from 'next/server';
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { BEDROCK_MODEL_ID, AWS_REGION } from '@/config/bedrock';

const client = new BedrockRuntimeClient({
  region: AWS_REGION,
});

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendData = async (data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      const body = await request.json();
      const { messages, programId, customFields = [] } = body;

      // Build custom fields description
      const customFieldsDesc =
        customFields.length > 0
          ? `\n\nProgram-specific demographics to extract:\n${customFields
              .map((f: any) => {
                const opts = f.options
                  ? ` (options: ${f.options.join(', ')})`
                  : '';
                return `- ${f.label} (${f.fieldType})${opts}`;
              })
              .join('\n')}`
          : '';

      // System prompt for participant extraction
      const systemPrompt = `You are a helpful assistant that extracts participant information from natural language descriptions.

Extract the following information when available:
- firstName: First name of the participant
- lastName: Last name of the participant
- dateOfBirth: Date of birth in YYYY-MM-DD format
- approximateAge: Age in years (if DOB not available)
- gender: Gender code (0=Female, 1=Male, 2=Transgender, 3=Non-Binary, 4=Culturally Specific, 5=Different Identity, 99=Data Not Collected)
- email: Email address
- phoneNumber: Phone number
- address: Full address${customFieldsDesc}

When custom fields are mentioned, extract them into a "customFields" object with field names as keys.

Return the extracted data in a JSON code block in this format:
\`\`\`json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD" or null,
  "approximateAge": number or null,
  "gender": 0-5 or 99,
  "email": "string" or null,
  "phoneNumber": "string" or null,
  "address": "string" or null,
  "customFields": {
    "fieldName": "value"
  }
}
\`\`\`

After each extraction, ask clarifying questions about missing required information or custom fields that haven't been answered yet.`;

      // Prepare messages for Claude
      const conversationMessages = messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: [{ text: msg.content }],
      }));

      const command = new ConverseStreamCommand({
        modelId: BEDROCK_MODEL_ID,
        messages: conversationMessages,
        system: [{ text: systemPrompt }],
        inferenceConfig: {
          maxTokens: 4096,
          temperature: 0.7,
        },
      });

      const response = await client.send(command);
      let fullResponse = '';
      let extractedData: any = null;

      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockDelta?.delta?.text) {
            const text = event.contentBlockDelta.delta.text;
            fullResponse += text;
            await sendData({ type: 'token', content: text });

            // Try to extract JSON from response
            const jsonMatch = fullResponse.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[1]);
                extractedData = parsed;
                await sendData({ type: 'extraction', data: extractedData });
              } catch (e) {
                // JSON not complete yet
              }
            }
          }

          if (event.messageStop) {
            await sendData({ type: 'done' });
          }
        }
      }

      await writer.close();
    } catch (error) {
      console.error('Error in participant extraction:', error);
      await sendData({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
