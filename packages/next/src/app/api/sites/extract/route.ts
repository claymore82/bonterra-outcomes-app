import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { NextRequest } from 'next/server';
import { BEDROCK_MODEL_ID, AWS_REGION } from '@/config/bedrock';

const SYSTEM_PROMPT = `You are an AI assistant helping to create new site records for a case management system. Your job is to extract site information from the user's natural language description.

Extract the following information:
- name: Full site name
- address: Street address
- city: City name
- state: Two-letter state code (e.g., WA, CA, NY)
- zipCode: 5-digit ZIP code
- phone: Phone number (format: (XXX) XXX-XXXX)
- email: Email address
- capacity: Maximum number of people the site can serve
- programNames: Array of program names that operate at this site (extract from context like "emergency shelter", "job training", etc.)
- status: 'active' or 'inactive' (default to 'active' unless specified)
- hoursOfOperation: Description of when the site is open
- accessibilityFeatures: Array of accessibility features (wheelchair accessible, ADA compliant, etc.)
- contactPerson: Name of the contact person/site manager

When you extract data, respond with TWO things:
1. A conversational response acknowledging what you extracted and asking for any missing critical information (name, address, city, state, zipCode)
2. A JSON object with the extracted data in this exact format:

EXTRACTION_START
{
  "name": "extracted name",
  "address": "street address",
  "city": "city",
  "state": "STATE",
  "zipCode": "12345",
  "phone": "(206) 555-0100",
  "email": "email@example.com",
  "capacity": 50,
  "programNames": ["Emergency Shelter", "Job Training"],
  "status": "active",
  "hoursOfOperation": "24/7",
  "accessibilityFeatures": ["Wheelchair accessible"],
  "contactPerson": "John Doe"
}
EXTRACTION_END

Guidelines:
- Be conversational and helpful
- Ask clarifying questions if information is ambiguous
- Validate that addresses make sense
- If the user mentions program types, extract them into programNames array
- Default to status: "active" unless the user says otherwise
- If capacity is mentioned as a range, use the maximum number
- Extract accessibility features from any mention of accommodations
- Only include fields where you have data - omit fields that weren't mentioned`;

function getBedrockClient(): BedrockRuntimeClient {
  const config: any = {
    region: AWS_REGION,
  };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return new BedrockRuntimeClient(config);
}

export async function POST(req: NextRequest) {
  try {
    const { messages, availablePrograms } = await req.json();

    // Add available programs to the context
    const systemPromptWithPrograms = `${SYSTEM_PROMPT}

Available programs in the system:
${availablePrograms.map((p: { id: string; name: string }) => `- ${p.name}`).join('\n')}

When the user mentions programs, try to match them to these available programs.`;

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const bedrockClient = getBedrockClient();

          // Convert messages to Bedrock format
          const bedrockMessages = messages.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: [{ text: msg.content }],
          }));

          const command = new ConverseCommand({
            modelId: BEDROCK_MODEL_ID,
            messages: bedrockMessages,
            system: [{ text: systemPromptWithPrograms }],
            inferenceConfig: {
              maxTokens: 2000,
              temperature: 0.7,
            },
          });

          const response = await bedrockClient.send(command);

          if (response.output?.message?.content) {
            const fullText = response.output.message.content
              .map((block: any) => ('text' in block ? block.text : ''))
              .join('');

            // Stream the text token by token for UI effect
            for (let i = 0; i < fullText.length; i++) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'token', content: fullText[i] })}\n\n`)
              );
            }

            // Extract data from the response
            const extractionMatch = fullText.match(/EXTRACTION_START\s*([\s\S]*?)\s*EXTRACTION_END/);
            if (extractionMatch) {
              try {
                const extractedData = JSON.parse(extractionMatch[1]);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'extraction', data: extractedData })}\n\n`
                  )
                );
              } catch (e) {
                console.error('Failed to parse extraction:', e);
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Failed to process request' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
