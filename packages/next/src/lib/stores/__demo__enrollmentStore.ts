/**
 * Enrollment Store Demo
 *
 * This file demonstrates how to use the enrollment store for common operations.
 * Run this in a React component or test environment.
 */

import { useEnrollmentStore } from './enrollmentStore';

// Example 1: Get all enrollments for a participant
export function demoGetParticipantEnrollments() {
  const { getEnrollmentsByParticipant } = useEnrollmentStore.getState();

  // John Smith (P-001) has 3 enrollments
  const johnEnrollments = getEnrollmentsByParticipant('P-001');
  console.log(`John Smith has ${johnEnrollments.length} enrollments`);

  /*
   * Output shows:
   * 1. Emergency Shelter (completed Jan-Mar 2025)
   * 2. Job Training (completed Feb-May 2025)
   * 3. Rapid Rehousing (active Oct 2025-present)
   */
}

// Example 2: Get active enrollments for a participant
export function demoGetActiveEnrollments() {
  const { getActiveEnrollments } = useEnrollmentStore.getState();

  // Get John's active enrollments
  const activeEnrollments = getActiveEnrollments('P-001');
  console.log(`John has ${activeEnrollments.length} active enrollment(s)`);
  console.log('Active program:', activeEnrollments[0]?.programId);

  /*
   * Output: Rapid Rehousing (PROG-002)
   */
}

// Example 3: Get enrollment history (chronological)
export function demoGetEnrollmentHistory() {
  const { getEnrollmentHistory } = useEnrollmentStore.getState();

  const history = getEnrollmentHistory('P-001');
  history.forEach((enrollment, index) => {
    console.log(`${index + 1}. ${enrollment.programId}: ${enrollment.status}`);
    console.log(`   Start: ${enrollment.startDate.toLocaleDateString()}`);
    console.log(`   End: ${enrollment.endDate?.toLocaleDateString() || 'Active'}`);
  });

  /*
   * Shows complete enrollment journey from newest to oldest
   */
}

// Example 4: Track services received
export function demoServicesReceived() {
  const { getEnrollmentById } = useEnrollmentStore.getState();

  // John's Rapid Rehousing enrollment
  const enrollment = getEnrollmentById('ENR-003');

  if (enrollment) {
    console.log('Services received:');
    enrollment.servicesReceived.forEach(service => {
      console.log(`- ${service.serviceType}: ${service.amount} ${service.unit}`);
      console.log(`  Date: ${service.date.toLocaleDateString()}`);
      console.log(`  Provider: ${service.providedBy}`);
    });
  }

  /*
   * Output:
   * - Rental assistance: $2000 (security deposit)
   * - Rental assistance: $1200 (month 1)
   * - Rental assistance: $1200 (month 2)
   * - Housing counseling: 12 sessions
   */
}

// Example 5: Add a new service to an enrollment
export function demoAddService() {
  const { addServiceReceived, getEnrollmentById } = useEnrollmentStore.getState();

  // Add a new service to John's Rapid Rehousing
  addServiceReceived('ENR-003', {
    id: `SVC-${Date.now()}`,
    serviceType: 'Rental assistance',
    date: new Date('2026-01-01'),
    amount: 1200,
    unit: 'dollars',
    providedBy: 'Hope Housing Services',
    notes: 'Monthly rent assistance - month 3'
  });

  const enrollment = getEnrollmentById('ENR-003');
  console.log(`Total services: ${enrollment?.servicesReceived.length}`);
}

// Example 6: Complete an enrollment with outcomes
export function demoCompleteEnrollment() {
  const { completeEnrollment, getEnrollmentById } = useEnrollmentStore.getState();

  // Complete Jane's job training
  completeEnrollment('ENR-005', [
    'Completed IT certification',
    'Obtained full-time employment as junior developer',
    'Earning $55,000/year'
  ]);

  const enrollment = getEnrollmentById('ENR-005');
  console.log(`Status: ${enrollment?.status}`);
  console.log('Outcomes achieved:', enrollment?.outcomes);
}

// Example 7: Dismiss an enrollment with reason
export function demoDismissEnrollment() {
  const { dismissEnrollment, getEnrollmentById } = useEnrollmentStore.getState();

  dismissEnrollment(
    'ENR-007',
    'Moved out of service area',
    ['Referred to services in new location'],
    [{
      id: 'SVC-NEW',
      serviceType: 'Referral to external agency',
      date: new Date(),
      amount: 1,
      unit: 'referral',
      providedBy: 'Emily Rodriguez',
      notes: 'Connected with shelter in Portland, OR'
    }]
  );

  const enrollment = getEnrollmentById('ENR-007');
  console.log(`Status: ${enrollment?.status}`);
  console.log(`Reason: ${enrollment?.dismissalReason}`);
}

// Example 8: Transfer to a new program
export function demoTransferEnrollment() {
  const { transferEnrollment, getEnrollmentsByParticipant } = useEnrollmentStore.getState();

  // Transfer participant from Emergency Shelter to Transitional Housing
  transferEnrollment(
    'ENR-001',
    'PROG-006', // Transitional Housing
    '1', // Sarah Johnson
    'Participant ready for more independent living arrangement'
  );

  const enrollments = getEnrollmentsByParticipant('P-001');
  console.log(`Total enrollments after transfer: ${enrollments.length}`);

  /*
   * Creates a new enrollment in Transitional Housing
   * Marks old enrollment as 'transferred'
   */
}

// Example 9: Calculate enrollment duration
export function demoEnrollmentDuration() {
  const { getEnrollmentDuration } = useEnrollmentStore.getState();

  // Get duration of completed enrollment
  const daysInShelter = getEnrollmentDuration('ENR-001');
  console.log(`Days in Emergency Shelter: ${daysInShelter}`);

  // Get duration of active enrollment
  const daysInRapidRehousing = getEnrollmentDuration('ENR-003');
  console.log(`Days in Rapid Rehousing so far: ${daysInRapidRehousing}`);
}

// Example 10: Query enrollments by program
export function demoEnrollmentsByProgram() {
  const { getEnrollmentsByProgram } = useEnrollmentStore.getState();

  // How many people have been in Emergency Shelter?
  const shelterEnrollments = getEnrollmentsByProgram('PROG-001');
  console.log(`Total Emergency Shelter enrollments: ${shelterEnrollments.length}`);

  const activeCount = shelterEnrollments.filter(e => e.status === 'active').length;
  const completedCount = shelterEnrollments.filter(e => e.status === 'completed').length;
  const dismissedCount = shelterEnrollments.filter(e => e.status === 'dismissed').length;

  console.log(`Active: ${activeCount}`);
  console.log(`Completed: ${completedCount}`);
  console.log(`Dismissed: ${dismissedCount}`);
}

// Example 11: Query case worker workload
export function demoCaseWorkerWorkload() {
  const { getEnrollmentsByCaseWorker, getActiveEnrollments } = useEnrollmentStore.getState();

  // Sarah Johnson's enrollments
  const sarahEnrollments = getEnrollmentsByCaseWorker('1');
  const sarahActiveEnrollments = sarahEnrollments.filter(e => e.status === 'active');

  console.log(`Sarah Johnson:`);
  console.log(`  Total enrollments: ${sarahEnrollments.length}`);
  console.log(`  Active case load: ${sarahActiveEnrollments.length}`);

  // List active participants
  sarahActiveEnrollments.forEach(enrollment => {
    console.log(`  - Participant ${enrollment.participantId} in ${enrollment.programId}`);
  });
}

// Example 12: Create a new enrollment
export function demoCreateEnrollment() {
  const { createEnrollment } = useEnrollmentStore.getState();

  const newEnrollment = createEnrollment({
    participantId: 'P-005',
    programId: 'PROG-003', // Job Training
    siteId: 'SITE-002',
    caseWorkerId: '2', // Michael Chen
    startDate: new Date(),
    endDate: null,
    status: 'active',
    outcomes: [],
    servicesReceived: [],
    outcomeGoals: [
      'Complete vocational training',
      'Obtain industry certification',
      'Secure employment'
    ],
    notes: 'Participant expressing strong interest in technical career path'
  });

  console.log(`Created new enrollment: ${newEnrollment.id}`);
  console.log(`Participant: ${newEnrollment.participantId}`);
  console.log(`Program: ${newEnrollment.programId}`);
}

/**
 * Real-world use case: Case manager dashboard
 */
export function demoCaseManagerDashboard(caseWorkerId: string) {
  const {
    getEnrollmentsByCaseWorker,
    getEnrollmentDuration,
    getEnrollmentById
  } = useEnrollmentStore.getState();

  const myEnrollments = getEnrollmentsByCaseWorker(caseWorkerId);
  const active = myEnrollments.filter(e => e.status === 'active');

  console.log(`\n=== Case Manager Dashboard ===`);
  console.log(`Active case load: ${active.length} participants\n`);

  active.forEach(enrollment => {
    const days = getEnrollmentDuration(enrollment.id);
    const servicesCount = enrollment.servicesReceived.length;

    console.log(`Participant: ${enrollment.participantId}`);
    console.log(`  Program: ${enrollment.programId}`);
    console.log(`  Days enrolled: ${days}`);
    console.log(`  Services provided: ${servicesCount}`);
    console.log(`  Outcome goals: ${enrollment.outcomeGoals.length}`);
    console.log('');
  });
}
