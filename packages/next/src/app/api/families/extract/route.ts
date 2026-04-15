import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { NextRequest } from 'next/server';
import { BEDROCK_MODEL_ID, AWS_REGION } from '@/config/bedrock';

const SYSTEM_PROMPT = `You are an AI assistant helping to create family/household records for a case management system. Extract family member information from natural language descriptions.

Extract the following information for each family member:
- firstName: First name
- lastName: Last name
- dateOfBirth: ISO date string (YYYY-MM-DD) if exact date mentioned
- approximateAge: Number if only age mentioned
- dobDataQuality: "1" (full DOB), "2" (approximate), "8" (don't know), "9" (prefer not to answer), "99" (not collected)
- gender: HMIS codes - "0" (Woman), "1" (Man), "2" (Culturally Specific), "3" (Transgender), "4" (Non-Binary), "5" (Questioning), "99" (Data not collected)
- phoneNumber: Phone number
- email: Email address
- relationshipToHoH: Relationship to head of household - "self", "spouse", "partner", "child", "parent", "sibling", "guardian", "grandparent", "grandchild", "other"

HEAD OF HOUSEHOLD:
- The head of household has relationshipToHoH: "self"
- Typically the first person mentioned or explicitly stated
- If unclear, ask who should be the head of household

SMART DEFAULTS:
- Children often share last name with parents
- Spouses may have different last names (ask to confirm)
- Shared phone/email for household
- Calculate dateOfBirth from age if only age given

CONVERSATION FLOW:
1. Understand who is in the family
2. Identify head of household
3. Collect names and basic info for each member
4. Ask about relationships
5. Fill in details (age/DOB, gender, contact info)
6. Review and confirm

Be conversational, friendly, and efficient. Ask one question at a time for families with 2-3 people, but you can group questions for larger families.`;

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
    const { messages, existingParticipants = [] } = await req.json();

    const bedrockClient = getBedrockClient();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const converseMessages = messages.map((msg: any) => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: [{ text: msg.content }],
          }));

          const command = new ConverseStreamCommand({
            modelId: BEDROCK_MODEL_ID,
            messages: converseMessages,
            system: [{ text: SYSTEM_PROMPT }],
            inferenceConfig: {
              maxTokens: 2048,
              temperature: 0.7,
            },
          });

          const response = await bedrockClient.send(command);

          let fullText = '';

          if (response.stream) {
            for await (const event of response.stream) {
              if (event.contentBlockDelta?.delta?.text) {
                const text = event.contentBlockDelta.delta.text;
                fullText += text;

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'token', content: text })}\n\n`)
                );
              }

              if (event.messageStop) {
                try {
                  const extractionCommand = new ConverseCommand({
                    modelId: BEDROCK_MODEL_ID,
                    messages: [
                      ...converseMessages,
                      {
                        role: 'assistant',
                        content: [{ text: fullText }],
                      },
                      {
                        role: 'user',
                        content: [{
                          text: `Extract structured family data from the conversation. Return JSON:
{
  "members": [
    {
      "tempId": "temp-1", "temp-2", etc,
      "firstName": string or null,
      "lastName": string or null,
      "dateOfBirth": "YYYY-MM-DD" or null,
      "approximateAge": number or null,
      "dobDataQuality": "1"|"2"|"8"|"9"|"99" or null,
      "gender": "0"|"1"|"2"|"3"|"4"|"5"|"99" or null,
      "phoneNumber": string or null,
      "email": string or null,
      "relationshipToHoH": "self"|"spouse"|"partner"|"child"|"parent"|"sibling"|"guardian"|"grandparent"|"grandchild"|"other",
      "confidence": {
        "firstName": 0-1 or null,
        "lastName": 0-1 or null,
        "dateOfBirth": 0-1 or null,
        "gender": 0-1 or null,
        "relationshipToHoH": 0-1 or null
      }
    }
  ],
  "headOfHouseholdId": string (tempId of member with relationshipToHoH: "self")
}

IMPORTANT:
- Include ALL family members mentioned
- One member MUST have relationshipToHoH: "self" (head of household)
- Use temporary IDs like "temp-1", "temp-2"
- If field not mentioned, use null
- Confidence is 0-1 (1 = very confident)

Return ONLY valid JSON, no other text.`
                        }],
                      },
                    ],
                    system: [{ text: 'You are a data extraction assistant. Return only valid JSON.' }],
                    inferenceConfig: {
                      maxTokens: 2048,
                      temperature: 0.3,
                    },
                  });

                  const extractionResponse = await bedrockClient.send(extractionCommand);

                  if (extractionResponse.output?.message?.content) {
                    const extractedText = extractionResponse.output.message.content
                      .map((block: ContentBlock) => ('text' in block ? block.text : ''))
                      .join('');

                    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      const extractedData = JSON.parse(jsonMatch[0]);

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'extraction', data: extractedData })}\n\n`
                        )
                      );
                    }
                  }
                } catch (extractError) {
                  console.error('Extraction error:', extractError);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'error', error: 'Failed to extract data' })}\n\n`
                    )
                  );
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                );
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
