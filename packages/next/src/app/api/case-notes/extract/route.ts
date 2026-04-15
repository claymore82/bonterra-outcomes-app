import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { NextRequest } from 'next/server';
import { BEDROCK_MODEL_ID, AWS_REGION } from '@/config/bedrock';

const EXTRACTION_PROMPT = `You are an AI assistant that extracts structured data from case worker touchpoint notes. Your job is to identify key information from natural language case notes and return it in a structured format that can be used to automatically create service transactions and track outcomes.

Extract the following information if present:

1. SERVICES PROVIDED: List services with quantities and dollar amounts
   - Be specific about service type (e.g., "Rental assistance", "Individual therapy", "GED classes")
   - Include quantity and unit (e.g., 1 session, 3 hours, 200 dollars)
   - Include dollar amount if mentioned
   - Set createTransaction to true if this is a new service that should be recorded

2. GOAL PROGRESS: Track progress toward participant goals
   - Identify which goal is being discussed
   - Status: positive/negative/neutral
   - Estimate percentComplete if possible (0-100)

3. OUTCOME ACHIEVEMENTS: Major milestones or goals completed
   - Examples: "Completed GED", "Got job", "Moved to permanent housing"
   - Include evidence from the notes

4. STATUS CHANGES: Life situation changes
   - Employment changes (from/to status)
   - Housing changes (from/to status)
   - Income changes (from/to with amounts)
   - Health changes (from/to with description)

5. PARTICIPANT STATE:
   - Emotional state (primary emotion + description)
   - Risk flags (only flag genuine concerns)
   - New needs identified
   - Action items for follow-up

Return a JSON object with this structure:
{
  "servicesProvided": [
    {
      "serviceType": "specific service name",
      "quantity": 1,
      "unit": "session|hour|dollar|night|etc",
      "amount": 150.00,
      "confidence": 0.95,
      "createTransaction": true
    }
  ],
  "progressOnGoals": [
    {
      "goal": "goal description",
      "status": "positive|negative|neutral",
      "notes": "specific progress details",
      "percentComplete": 75
    }
  ],
  "outcomeAchievements": [
    {
      "goal": "goal achieved",
      "achieved": true,
      "date": "2026-03-31",
      "evidence": "what proves this",
      "confidence": 0.95
    }
  ],
  "employmentChange": {
    "from": "previous status",
    "to": "new status",
    "date": "2026-03-31",
    "description": "details"
  },
  "housingChange": {
    "from": "previous situation",
    "to": "new situation",
    "date": "2026-03-31",
    "description": "details"
  },
  "incomeChange": {
    "from": "previous income",
    "to": "new income with amount",
    "date": "2026-03-31",
    "description": "details"
  },
  "healthChange": {
    "from": "previous health state",
    "to": "new health state",
    "date": "2026-03-31",
    "description": "details"
  },
  "emotionalState": {
    "primary": "hopeful|anxious|frustrated|etc",
    "description": "fuller context"
  },
  "riskFlags": [
    {
      "type": "housing|health|safety|financial|legal|other",
      "severity": "low|medium|high",
      "description": "specific concern"
    }
  ],
  "newNeeds": ["need1", "need2"],
  "actionItems": [
    {
      "description": "what needs to be done",
      "dueDate": "2026-04-15",
      "completed": false
    }
  ],
  "confidence": {
    "servicesProvided": 0.95,
    "progressOnGoals": 0.90,
    "outcomeAchievements": 0.95,
    "emotionalState": 0.85
  }
}

Guidelines:
- Extract specific dollar amounts and quantities when mentioned
- Be conservative with createTransaction - only set to true for clearly delivered services
- Only include fields that are present in the notes (use null/empty array for missing)
- For status changes, include what changed FROM and TO
- Confidence scores: 1.0 = very confident, 0.5 = somewhat confident
- Return ONLY the JSON object, no additional text`;

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
    const { participantId, noteText, participantContext, touchpointFields } = await req.json();

    if (!noteText || noteText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: 'Note text must be at least 20 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bedrockClient = getBedrockClient();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build context message
          let contextMessage = `Extract structured data from these case notes:\n\n`;

          if (participantContext) {
            contextMessage += `PARTICIPANT: ${participantContext.name}\n`;
            if (participantContext.program) {
              contextMessage += `PROGRAM: ${participantContext.program}\n`;
            }
            if (participantContext.outcomeGoal) {
              contextMessage += `PRIMARY GOAL: ${participantContext.outcomeGoal}\n`;
            }
            contextMessage += `\n`;
          }

          contextMessage += `CASE NOTES:\n${noteText}\n\nReturn the extracted data as JSON.`;

          const command = new ConverseCommand({
            modelId: BEDROCK_MODEL_ID,
            messages: [
              {
                role: 'user',
                content: [{ text: contextMessage }],
              },
            ],
            system: [{ text: EXTRACTION_PROMPT }],
            inferenceConfig: {
              maxTokens: 2048,
              temperature: 0.3,
            },
          });

          const response = await bedrockClient.send(command);

          if (response.output?.message?.content) {
            const extractedText = response.output.message.content
              .map((block: any) => ('text' in block ? block.text : ''))
              .join('');

            // Try to parse JSON from the response
            const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const extracted = JSON.parse(jsonMatch[0]);

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'extraction', data: extracted })}\n\n`
                )
              );
            }
          }

          // Extract custom touchpoint field values if fields are provided
          if (touchpointFields && touchpointFields.length > 0) {
            try {
              // Identify triggered fields based on keywords
              const triggeredFields = touchpointFields.filter((field: any) => {
                const noteTextLower = noteText.toLowerCase();
                return field.trigger.keywords.some((keyword: string) =>
                  noteTextLower.includes(keyword.toLowerCase())
                );
              });

              if (triggeredFields.length > 0) {
                // Build field extraction prompt
                const fieldPrompt = `Extract values for these custom fields from the case notes:

CASE NOTES:
${noteText}

FIELDS TO EXTRACT:
${triggeredFields.map((field: any) => `
- ${field.name} (${field.fieldType}):
  Description: ${field.description || 'N/A'}
  ${field.options ? `Options: ${field.options.join(', ')}` : ''}
  ${field.min !== undefined ? `Min: ${field.min}` : ''}
  ${field.max !== undefined ? `Max: ${field.max}` : ''}
`).join('\n')}

Return JSON:
{
  "fieldValues": [
    {
      "fieldId": "field id",
      "fieldName": "field name",
      "value": "extracted value (match option if dropdown/multi-select, use number for scale/number, boolean for checkbox)",
      "confidence": 0.0-1.0,
      "extractedFrom": "the specific quote from notes that supports this"
    }
  ]
}

Guidelines:
- Only include fields where you found a clear value
- For dropdowns/multi-select, value MUST match one of the provided options exactly
- For scale fields, value must be between min and max
- For checkbox, value should be true or false
- Confidence 1.0 = very confident, 0.5 = somewhat confident
- Return ONLY the JSON, no other text`;

                const fieldCommand = new ConverseCommand({
                  modelId: BEDROCK_MODEL_ID,
                  messages: [
                    {
                      role: 'user',
                      content: [{ text: fieldPrompt }],
                    },
                  ],
                  system: [{ text: 'You are a data extraction assistant. Return only valid JSON.' }],
                  inferenceConfig: {
                    maxTokens: 2048,
                    temperature: 0.3,
                  },
                });

                const fieldResponse = await bedrockClient.send(fieldCommand);

                if (fieldResponse.output?.message?.content) {
                  const fieldText = fieldResponse.output.message.content
                    .map((block: any) => ('text' in block ? block.text : ''))
                    .join('');

                  const fieldJsonMatch = fieldText.match(/\{[\s\S]*\}/);
                  if (fieldJsonMatch) {
                    try {
                      const fieldData = JSON.parse(fieldJsonMatch[0]);

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'customFields', data: fieldData })}\n\n`
                        )
                      );
                    } catch (parseError) {
                      console.error('Failed to parse custom field JSON:', parseError);
                      // Send empty custom fields on parse error
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'customFields', data: { fieldValues: [] } })}\n\n`
                        )
                      );
                    }
                  }
                }
              }
            } catch (fieldError) {
              console.error('Custom field extraction error:', fieldError);
              // Don't fail the whole request if field extraction fails
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );

          controller.close();
        } catch (error) {
          console.error('Extraction error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
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
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
