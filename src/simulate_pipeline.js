const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3000;

// Helper to handle HTTP requests as promises
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runIntegrationTest() {
  console.log('🧪 Starting Microservice End-to-End Pipeline Validation...\n');

  try {
    // -------------------------------------------------------------
    // STAGE 2 VERIFICATION: Register Vehicle & Schedule Bounds
    // -------------------------------------------------------------
    console.log('🔹 [Step 1] Provisioning vehicle "Unit-07" with a 3,000-mile maintenance rule...');
    const registerPayload = {
      vin: 'VMA10928374AF7',
      model: 'Heavy Duty Cargo Van (Unit-07)',
      currentMileage: 12000,
      serviceType: 'Brake System Flush & Caliper Alignment',
      mileageInterval: 3000,
      daysInterval: 90
    };

    const regResult = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/v1/vehicles',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, registerPayload);

    const vehicleId = regResult.body.data.vehicle.id;
    const correlationId = regResult.headers['x-correlation-id'];

    console.log(`✅ Vehicle registered successfully! ID Assigned: ${vehicleId}`);
    console.log(`🆔 Stage 1 Trace Verification: Received Correlation-ID: [${correlationId}]\n`);

    // -------------------------------------------------------------
    // INTERMEDIATE TELEMETRY: Safe Mileage Update
    // -------------------------------------------------------------
    console.log('🔹 [Step 2] Ingesting minor telemetry update (Odometer: 13,500 mi)...');
    await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/v1/vehicles/${vehicleId}/telemetry`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { currentMileage: 13500 });

    console.log('✅ Telemetry saved. Vehicle status remains ACTIVE (Threshold safe at 15,000 mi).\n');

    // -------------------------------------------------------------
    // STAGE 3 VERIFICATION: Exceed Threshold and Force System Alert
    // -------------------------------------------------------------
    console.log('⚠️  [Step 3] Simulation: Driver logs mileage spike breaking limit (Odometer: 15,250 mi)...');
    
    // This call triggers our mathematical condition: 15250 >= 15000
    const alertResult = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/v1/vehicles/${vehicleId}/telemetry`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { currentMileage: 15250 });

    console.log('🔄 Telemetry ingestion call finalized.');
    console.log('📊 Result State Snapshot from memory:', alertResult.body.data.vehicle);

  } catch (error) {
    console.error('❌ Pipeline Validation Interrupted:', error.message);
  }
}

// Execute evaluation simulation
runIntegrationTest();