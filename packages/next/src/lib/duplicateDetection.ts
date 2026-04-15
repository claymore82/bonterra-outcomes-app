import { Participant, ExtractedData, DuplicateMatch } from '@/types/poc';

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}

function fuzzyMatch(str1?: string, str2?: string): number {
  if (!str1 || !str2) return 0;

  const distance = levenshteinDistance(
    str1.toLowerCase(),
    str2.toLowerCase()
  );
  const maxLength = Math.max(str1.length, str2.length);

  return 1 - distance / maxLength;
}

function isSameDay(date1?: Date | string, date2?: Date | string): boolean {
  if (!date1 || !date2) return false;

  // Convert to Date objects if they're strings
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  // Check if dates are valid
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

  // Check if date is valid
  if (isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function checkMatch(
  extracted: ExtractedData,
  participant: Participant
): DuplicateMatch | null {
  // Rule 1: Exact name + DOB match
  if (
    extracted.firstName?.toLowerCase() === participant.firstName.toLowerCase() &&
    extracted.lastName?.toLowerCase() === participant.lastName.toLowerCase() &&
    extracted.dateOfBirth &&
    isSameDay(extracted.dateOfBirth, participant.dateOfBirth)
  ) {
    return {
      participant,
      confidence: 'high',
      matchReason: 'Exact name and date of birth match',
    };
  }

  // Rule 2: Fuzzy name + DOB match
  if (
    fuzzyMatch(extracted.firstName, participant.firstName) > 0.8 &&
    fuzzyMatch(extracted.lastName, participant.lastName) > 0.8 &&
    extracted.dateOfBirth &&
    isSameDay(extracted.dateOfBirth, participant.dateOfBirth)
  ) {
    return {
      participant,
      confidence: 'medium',
      matchReason: 'Similar name and matching date of birth',
    };
  }

  // Rule 3: Exact name + approximate age match
  if (
    extracted.firstName?.toLowerCase() === participant.firstName.toLowerCase() &&
    extracted.lastName?.toLowerCase() === participant.lastName.toLowerCase() &&
    extracted.approximateAge &&
    Math.abs(extracted.approximateAge - calculateAge(participant.dateOfBirth)) <= 1
  ) {
    return {
      participant,
      confidence: 'low',
      matchReason: 'Matching name and similar age',
    };
  }

  return null;
}

export function findDuplicates(
  extractedData: ExtractedData,
  existingParticipants: Participant[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const participant of existingParticipants) {
    const match = checkMatch(extractedData, participant);
    if (match) {
      matches.push(match);
    }
  }

  // Sort by confidence (high → low)
  return matches.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
}
