import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { NextRequest, NextResponse } from 'next/server';
import { BEDROCK_MODEL_ID, AWS_REGION } from '@/config/bedrock';

interface ExtractedField {
  value: string;
  confidence: number;
}

interface DocumentExtractionResult {
  firstName?: ExtractedField;
  lastName?: ExtractedField;
  dateOfBirth?: ExtractedField;
  address?: ExtractedField;
  documentType?: ExtractedField;
  documentNumber?: ExtractedField;
}

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
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extract base64 data and media type from data URL
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const mediaType = matches[1];
    const base64Data = matches[2];

    // Validate media type
    const validMediaTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMediaTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: 'Unsupported image format. Please use JPG, PNG, or WebP.' },
        { status: 400 }
      );
    }

    const bedrockClient = getBedrockClient();

    const prompt = `You are an AI document extraction specialist. Extract participant information from this government-issued identification document.

SUPPORTED DOCUMENT TYPES:
- Driver's License
- State ID
- Birth Certificate
- Social Security Card
- Passport
- Any government-issued ID

EXTRACT THE FOLLOWING INFORMATION (if present):
1. Document Type (e.g., "Driver's License", "State ID", "Birth Certificate")
2. First Name
3. Last Name
4. Date of Birth (convert to ISO 8601 format: YYYY-MM-DD)
5. Address (full address as shown)
6. Document Number (ID number, license number, etc.)

IMPORTANT INSTRUCTIONS:
- Only extract information that is clearly visible and legible
- Provide confidence scores (0.0 to 1.0) for each extracted field
- Use 1.0 for clearly printed text, 0.7-0.9 for slightly unclear text, below 0.7 for uncertain
- For dates, convert any format to YYYY-MM-DD
- Return ONLY valid JSON, no additional text

RESPONSE FORMAT:
{
  "documentType": { "value": "Driver's License", "confidence": 0.95 },
  "firstName": { "value": "John", "confidence": 0.98 },
  "lastName": { "value": "Smith", "confidence": 0.98 },
  "dateOfBirth": { "value": "1985-03-15", "confidence": 0.92 },
  "address": { "value": "123 Main St, Anytown, CA 12345", "confidence": 0.90 },
  "documentNumber": { "value": "D1234567", "confidence": 0.95 }
}

If a field is not present or not legible, omit it from the response. Return ONLY the JSON object.`;

    const command = new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [
            {
              image: {
                format: mediaType.split('/')[1] as 'jpeg' | 'png' | 'gif' | 'webp',
                source: {
                  bytes: Buffer.from(base64Data, 'base64'),
                },
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.2, // Low temperature for precise extraction
      },
    });

    const response = await bedrockClient.send(command);

    if (!response.output?.message?.content) {
      throw new Error('No response from Bedrock');
    }

    // Extract text from response
    const responseText = response.output.message.content
      .map((block) => ('text' in block ? block.text : ''))
      .join('');

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const extractedData: DocumentExtractionResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Document extraction error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to extract document data',
      },
      { status: 500 }
    );
  }
}
