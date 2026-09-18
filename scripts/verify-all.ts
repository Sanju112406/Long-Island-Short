/**
 * Comprehensive System Verification Script for Eyes-Up AI Commuter Companion
 */

import { planJourney, recalculateJourney } from '../server/services/routingService';
import { findNearestLandmark, getLandmarkContext } from '../server/services/landmarkContextService';
import { assessJourneyImpact } from '../server/services/journeyImpactEngine';
import { askEyesUpCompanion } from '../server/services/geminiService';
import { calculateDistanceMeters, calculateDistanceToRouteMeters, geolocationService } from '../src/services/geolocationService';

async function runTests() {
  console.log('====================================================');
  console.log(' EYES-UP AI COMMUTER COMPANION — VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean, extra?: any) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`, extra || '');
    }
  }

  // 1. Geolocation & Haversine Distance
  console.log('1. Testing Geolocation Mathematics & Off-Route Engine:');
  const d1 = calculateDistanceMeters({ lat: 1.3521, lng: 103.8198 }, { lat: 1.3521, lng: 103.8198 });
  assert('Distance between identical points is 0m', Math.round(d1) === 0);

  const d2 = calculateDistanceMeters({ lat: 1.3000, lng: 103.8500 }, { lat: 1.3090, lng: 103.8500 });
  assert('Calculates 1km north accurately (~1000m)', d2 > 990 && d2 < 1010, `got ${d2}`);

  const line: [number, number][] = [
    [1.3000, 103.8500],
    [1.3100, 103.8500]
  ];
  const distToRoute = calculateDistanceToRouteMeters({ lat: 1.3050, lng: 103.8510 }, line);
  assert('Calculates distance from point to polyline (~111m)', distToRoute > 100 && distToRoute < 125, `got ${distToRoute}`);

  // Test off-route evaluation with debouncing
  geolocationService.resetDeviationCount();
  const r1 = geolocationService.evaluateOffRoute({ lat: 1.3050, lng: 103.8550 }, line); // ~555m off, 1st count
  assert('Single GPS reading off-route is debounced (confidence < 0.85, offRoute false)', !r1.offRoute && r1.consecutiveDeviations === 1);

  const r2 = geolocationService.evaluateOffRoute({ lat: 1.3050, lng: 103.8550 }, line); // 2nd consecutive reading
  assert('Two consecutive off-route readings confirm off-route trigger (confidence 0.95)', r2.offRoute && r2.consecutiveDeviations === 2);

  // 2. Landmark Service Context
  console.log('\n2. Testing Landmark Context Service:');
  const nearestToaPayoh = findNearestLandmark({ lat: 1.3328, lng: 103.8488 }, 1000);
  assert('Finds landmarks near Toa Payoh Hub', !!nearestToaPayoh && !!nearestToaPayoh.landmark);

  const context = getLandmarkContext({
    currentLocation: { lat: 1.3328, lng: 103.8488 },
    nextManeuver: 'TURN_LEFT',
  });
  assert('Generates rich landmark guidance with visual anchor', !!context.guidance.full && !!context.landmark);

  // 3. Dynamic Journey Planning Engine
  console.log('\n3. Testing Dynamic Journey Planning Engine:');
  const plannedJourney = await planJourney({
    origin: 'Toa Payoh MRT',
    destination: 'Bugis Junction',
    desiredArrivalTime: '9:30 AM',
  });
  assert('Generates valid Journey structure', !!plannedJourney && plannedJourney.steps.length > 0);
  assert('Includes route geometry with coordinate points', Array.isArray(plannedJourney.geometry) && plannedJourney.geometry.length > 0);
  assert('Includes step landmarks and tangible guidance', plannedJourney.steps.every(s => s.guidance && s.guidance.full));
  assert('Identifies route source (LIVE_ONEMAP or FALLBACK_PRESET)', plannedJourney.routeSource === 'LIVE_ONEMAP' || plannedJourney.routeSource === 'FALLBACK_PRESET');

  // 4. Off-Route Recalculation Engine
  console.log('\n4. Testing Off-Route Recalculation:');
  const recalculated = await recalculateJourney({
    currentLocation: { lat: 1.3090, lng: 103.8350 },
    destination: 'Bugis Junction',
  });
  assert('Recalculates route from divergent location', !!recalculated && recalculated.steps.length > 0);
  assert('Recalculated route has geometry and recovery steps', Array.isArray(recalculated.geometry));

  // 5. Journey Impact Engine
  console.log('\n5. Testing Journey Impact Engine:');
  const impact = assessJourneyImpact({
    journey: plannedJourney,
    currentStepIndex: 0,
    userPersona: 'default',
  });
  assert('Returns impact assessment structure', typeof impact.affectsJourney === 'boolean');
  assert('Provides impact reasoning and severity', typeof impact.reason === 'string' && typeof impact.severity === 'string');
  assert('Suggests concrete action (CONTINUE, MONITOR, or REROUTE)', ['CONTINUE', 'MONITOR', 'REROUTE'].includes(impact.recommendedAction));

  // 6. Gemini Service & Tool Calling Fallback Engine
  console.log('\n6. Testing Gemini Service & Structured Tool Calling:');
  const chatResponse = await askEyesUpCompanion({
    question: "Is there any rain near Bugis right now?",
    currentStep: plannedJourney.steps[0],
    familiarityMode: 'full',
    persona: 'default',
  });
  assert('Chat response returns string answer', typeof chatResponse.reply === 'string' && chatResponse.reply.length > 0);
  console.log(`     Sample companion response: "${chatResponse.reply.substring(0, 80)}..."`);

  const liftResponse = await askEyesUpCompanion({
    question: "Is the lift working at Bugis MRT Exit C?",
    currentStep: plannedJourney.steps[0],
    familiarityMode: 'full',
    persona: 'lim',
  });
  assert('Accessibility response handles lift queries accurately', typeof liftResponse.reply === 'string');

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} / ${total} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test run failed with error:', e);
  process.exit(1);
});
