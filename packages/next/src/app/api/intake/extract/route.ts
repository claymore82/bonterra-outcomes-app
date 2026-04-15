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
      const { messages, availablePrograms = [], availableCaseWorkers = [], customFields = [], enrolleeType = 'participant' } = body;

      // Build program list
      const programList = availablePrograms.length > 0
        ? `\n\nAvailable programs:\n${availablePrograms.map((p: any) => `- ${p.name}`).join('\n')}`
        : '';

      // Build case worker list
      const caseWorkerList = availableCaseWorkers.length > 0
        ? `\n\nAvailable case workers:\n${availableCaseWorkers.map((cw: any) => `- ${cw.name}`).join('\n')}`
        : '';

      // Build custom fields description
      const customFieldsDesc = customFields.length > 0
        ? `\n\nProgram-specific demographics to extract:\n${customFields
            .map((f: any) => {
              const opts = f.options ? ` (options: ${f.options.join(', ')})` : '';
              const req = f.required ? ' [REQUIRED]' : ' [OPTIONAL]';
              return `- ${f.label} (${f.fieldType})${opts}${req}`;
            })
            .join('\n')}`
        : '';

      // Build system prompt based on enrollee type
      let systemPrompt = '';

      if (enrolleeType === 'participant') {
        systemPrompt = `You are a helpful assistant that helps enroll participants in programs. You extract participant information AND enrollment details from natural language.

Extract the following information when available:

PARTICIPANT DEMOGRAPHICS:
- firstName: First name of the participant
- lastName: Last name of the participant
- dateOfBirth: Date of birth in YYYY-MM-DD format
- approximateAge: Age in years (if DOB not available)
- gender: Gender code (0=Female, 1=Male, 2=Transgender, 3=Non-Binary, 4=Culturally Specific, 5=Different Identity, 99=Data Not Collected)
- email: Email address
- phoneNumber: Phone number
- address: Full address${customFieldsDesc}

ENROLLMENT DETAILS:
- program: Program name (must match one from the available programs list)
- programId: Program ID (look up from available programs)
- caseWorker: Case worker name (must match one from available case workers list)
- caseWorkerId: Case worker ID (look up from available case workers)
- enrollmentDate: Enrollment date in YYYY-MM-DD format (default to today if not specified)${programList}${caseWorkerList}

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
  "program": "string",
  "programId": "string",
  "caseWorker": "string",
  "caseWorkerId": "string",
  "enrollmentDate": "YYYY-MM-DD",
  "customFields": {
    "fieldName": "value"
  }
}
\`\`\`

IMPORTANT RESPONSE FORMAT:
You MUST respond with TWO parts in EVERY message:
1. Your conversational response to the user
2. A JSON code block with ALL extracted data so far (even if partial/incomplete)

Example response format:
"Thank you! I'd be happy to help enroll Sean Morris. Which program would you like to enroll him in?

\`\`\`json
{
  "firstName": "Sean",
  "lastName": "Morris",
  "program": null,
  "programId": null
}
\`\`\`"

CONVERSATION RULES:
- Always start by asking which program the participant is enrolling in
- After program is selected, ask about participant demographics
- Always ask about case worker assignment
- Ask clarifying questions about missing required information
- Match program and case worker names to the available lists (use exact names)
- Look up IDs from the provided lists
- ALWAYS include the JSON block at the end of your response with cumulative extracted data
- Include fields as null if not yet provided`;
      } else if (enrolleeType === 'family') {
        systemPrompt = `You are a helpful assistant that helps enroll families/households in programs. You extract family member information AND enrollment details from natural language.

Extract the following information when available:

FAMILY/HOUSEHOLD:
- familyName: Family name (e.g., "Smith Family")
- familyMembers: Array of family members with:
  - tempId: Temporary ID (e.g., "temp-1", "temp-2")
  - firstName: First name
  - lastName: Last name
  - dateOfBirth: Date of birth in YYYY-MM-DD format
  - approximateAge: Age in years (if DOB not available)
  - gender: Gender code (0-5 or 99)
  - phoneNumber: Phone number
  - email: Email address
  - relationshipToHoH: Relationship to head of household ("self", "spouse", "partner", "child", "parent", "sibling", "guardian", "grandparent", "grandchild", "other")
- headOfHouseholdId: tempId of the head of household (member with relationshipToHoH: "self")
- address: Family address

ENROLLMENT DETAILS:
- program: Program name (must match one from the available programs list)
- programId: Program ID (look up from available programs)
- caseWorker: Case worker name (must match one from available case workers list)
- caseWorkerId: Case worker ID (look up from available case workers)
- enrollmentDate: Enrollment date in YYYY-MM-DD format (default to today if not specified)${programList}${caseWorkerList}

Return the extracted data in a JSON code block in this format:
\`\`\`json
{
  "familyName": "string",
  "familyMembers": [
    {
      "tempId": "temp-1",
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "YYYY-MM-DD" or null,
      "approximateAge": number or null,
      "gender": 0-5 or 99,
      "phoneNumber": "string" or null,
      "email": "string" or null,
      "relationshipToHoH": "self"
    }
  ],
  "headOfHouseholdId": "temp-1",
  "address": "string" or null,
  "program": "string",
  "programId": "string",
  "caseWorker": "string",
  "caseWorkerId": "string",
  "enrollmentDate": "YYYY-MM-DD"
}
\`\`\`

IMPORTANT RESPONSE FORMAT:
You MUST respond with TWO parts in EVERY message:
1. Your conversational response to the user
2. A JSON code block with ALL extracted data so far (even if partial/incomplete)

CONVERSATION RULES:
- Always ask about each family member
- One member MUST have relationshipToHoH: "self" (head of household)
- Ask clarifying questions about relationships
- Match program and case worker names to the available lists
- ALWAYS include the JSON block at the end of your response with cumulative extracted data
- Include fields as null if not yet provided`;
      } else if (enrolleeType === 'entity') {
        systemPrompt = `You are a helpful assistant that helps enroll organizations/entities in programs. You extract entity information AND enrollment details from natural language.

Extract the following information when available:

ENTITY/ORGANIZATION:
- entityName: Name of the organization
- entityType: Type of entity ("school", "employer", "healthcare_provider", "government_agency", "nonprofit_partner", "religious_organization", "housing_authority", "other")
- entityDescription: Description of the entity
- entityAddress: Street address
- entityCity: City
- entityState: State (2-letter code)
- entityZipCode: ZIP code
- entityPhone: Phone number
- entityEmail: Email address
- entityWebsite: Website URL
- contactPerson: Primary contact person name
- contactTitle: Contact person title

ENROLLMENT DETAILS:
- program: Program name (must match one from the available programs list)
- programId: Program ID (look up from available programs)
- caseWorker: Case worker name (must match one from available case workers list)
- caseWorkerId: Case worker ID (look up from available case workers)
- enrollmentDate: Enrollment date in YYYY-MM-DD format (default to today if not specified)${programList}${caseWorkerList}

Return the extracted data in a JSON code block in this format:
\`\`\`json
{
  "entityName": "string",
  "entityType": "school|employer|etc",
  "entityDescription": "string" or null,
  "entityAddress": "string" or null,
  "entityCity": "string" or null,
  "entityState": "XX" or null,
  "entityZipCode": "string" or null,
  "entityPhone": "string" or null,
  "entityEmail": "string" or null,
  "entityWebsite": "string" or null,
  "contactPerson": "string" or null,
  "contactTitle": "string" or null,
  "program": "string",
  "programId": "string",
  "caseWorker": "string",
  "caseWorkerId": "string",
  "enrollmentDate": "YYYY-MM-DD"
}
\`\`\`

IMPORTANT RESPONSE FORMAT:
You MUST respond with TWO parts in EVERY message:
1. Your conversational response to the user
2. A JSON code block with ALL extracted data so far (even if partial/incomplete)

CONVERSATION RULES:
- Always ask which type of organization this is
- Ask about contact person and contact information
- Match program and case worker names to the available lists
- ALWAYS include the JSON block at the end of your response with cumulative extracted data
- Include fields as null if not yet provided`;
      }

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

                // Look up program ID if program name is provided
                if (parsed.program && !parsed.programId && availablePrograms.length > 0) {
                  const matchedProgram = availablePrograms.find(
                    (p: any) => p.name.toLowerCase() === parsed.program.toLowerCase()
                  );
                  if (matchedProgram) {
                    parsed.programId = matchedProgram.id;
                  }
                }

                // Look up case worker ID if case worker name is provided
                if (parsed.caseWorker && !parsed.caseWorkerId && availableCaseWorkers.length > 0) {
                  const matchedCaseWorker = availableCaseWorkers.find(
                    (cw: any) => cw.name.toLowerCase() === parsed.caseWorker.toLowerCase()
                  );
                  if (matchedCaseWorker) {
                    parsed.caseWorkerId = matchedCaseWorker.id;
                  }
                }

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
      console.error('Error in intake extraction:', error);
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
