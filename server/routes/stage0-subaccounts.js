/**
 * Stage 0: Practice/Adviser Subaccount Management
 * 
 * Each practice/adviser group gets their own Twilio subaccount for:
 * - Isolated billing
 * - Separate phone numbers
 * - Independent regulatory compliance
 * - Practice-specific TwiML apps
 */

import { Router } from 'express';
import twilio from 'twilio';
import db from '../lib/db.js';

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://project-origin-production-1216.up.railway.app';

// Master account client
const masterClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// =====================================================
// SUBACCOUNT (PRACTICE) MANAGEMENT
// =====================================================

/**
 * GET /api/twilio/practices
 * List all practices with their Twilio subaccounts
 */
router.get('/practices', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM twilio_practices 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing practices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/practices/:id
 * Get a single practice with full details
 */
router.get('/practices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = result.rows[0];

    // Get associated phone numbers
    const numbersResult = await db.query(
      'SELECT * FROM phone_numbers WHERE practice_id = $1',
      [id]
    );

    // Get TwiML app
    const appResult = await db.query(
      'SELECT * FROM twilio_twiml_apps WHERE practice_id = $1',
      [id]
    );

    res.json({
      ...practice,
      phoneNumbers: numbersResult.rows,
      twimlApp: appResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Error getting practice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/practices
 * Create a new practice with Twilio subaccount
 */
router.post('/practices', async (req, res) => {
  try {
    const { 
      practiceName, 
      contactName, 
      contactEmail,
      abn,
      afslNumber,
    } = req.body;

    if (!practiceName || !contactEmail) {
      return res.status(400).json({ 
        error: 'practiceName and contactEmail are required' 
      });
    }

    console.log(`📋 Creating practice: ${practiceName}`);

    // Create Twilio subaccount
    const subaccount = await masterClient.api.accounts.create({
      friendlyName: `Axis CRM - ${practiceName}`,
    });

    console.log(`✅ Twilio subaccount created: ${subaccount.sid}`);

    // Store in database
    const result = await db.query(`
      INSERT INTO twilio_practices (
        practice_name, contact_name, contact_email, abn, afsl_number,
        twilio_account_sid, twilio_auth_token, 
        setup_step, setup_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      practiceName,
      contactName,
      contactEmail,
      abn,
      afslNumber,
      subaccount.sid,
      subaccount.authToken,
      'subaccount_created',
      'in_progress'
    ]);

    res.json({
      success: true,
      practice: result.rows[0],
      nextStep: 'regulatory_setup',
      message: 'Practice created. Next: Set up regulatory compliance for AU numbers.',
    });
  } catch (error) {
    console.error('Error creating practice:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/practices/:id/regulatory-address
 * Create regulatory address for a practice's subaccount
 */
router.post('/practices/:id/regulatory-address', async (req, res) => {
  try {
    const { id } = req.params;
    const { street, city, region, postalCode, customerName } = req.body;

    // Get practice
    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    // Create subaccount client
    const subClient = twilio(
      practice.twilio_account_sid,
      practice.twilio_auth_token
    );

    // Create address in subaccount
    const address = await subClient.addresses.create({
      customerName: customerName || practice.practice_name,
      street,
      city,
      region,
      postalCode,
      isoCountry: 'AU',
      friendlyName: `${practice.practice_name} - Business Address`,
    });

    console.log(`✅ Address created: ${address.sid}`);

    // Update practice with address
    await db.query(`
      UPDATE twilio_practices 
      SET address_sid = $1, setup_step = 'address_created'
      WHERE id = $2
    `, [address.sid, id]);

    res.json({
      success: true,
      addressSid: address.sid,
      address,
      nextStep: 'regulatory_bundle',
      message: 'Address created. Next: Create regulatory bundle.',
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/practices/:id/regulatory-bundle
 * Create and submit regulatory bundle for AU compliance
 */
router.post('/practices/:id/regulatory-bundle', async (req, res) => {
  try {
    const { id } = req.params;
    const { numberType = 'local' } = req.body;

    // Get practice
    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    if (!practice.address_sid) {
      return res.status(400).json({ 
        error: 'Address must be created first. Use POST /practices/:id/regulatory-address' 
      });
    }

    // Create subaccount client
    const subClient = twilio(
      practice.twilio_account_sid,
      practice.twilio_auth_token
    );

    // Get regulation SID for AU
    const regulations = await subClient.numbers.v2.regulatoryCompliance
      .regulations.list({ isoCountry: 'AU', numberType });
    
    if (regulations.length === 0) {
      return res.status(400).json({ error: 'No regulations found for AU' });
    }

    const regulationSid = regulations[0].sid;

    // Create bundle
    const bundle = await subClient.numbers.v2.regulatoryCompliance.bundles.create({
      friendlyName: `${practice.practice_name} - AU ${numberType}`,
      email: practice.contact_email,
      isoCountry: 'AU',
      numberType,
      regulationSid,
    });

    console.log(`✅ Bundle created: ${bundle.sid}`);

    // Assign address to bundle
    await subClient.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .itemAssignments.create({
        objectSid: practice.address_sid,
      });

    // Submit for review
    await subClient.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .update({ status: 'pending-review' });

    // Update practice
    await db.query(`
      UPDATE twilio_practices 
      SET bundle_sid = $1, bundle_status = 'pending-review', 
          setup_step = 'bundle_submitted'
      WHERE id = $2
    `, [bundle.sid, id]);

    res.json({
      success: true,
      bundleSid: bundle.sid,
      status: 'pending-review',
      nextStep: 'await_approval',
      message: 'Regulatory bundle submitted for review. This typically takes 1-3 business days.',
    });
  } catch (error) {
    console.error('Error creating bundle:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/practices/:id/bundle-status
 * Check regulatory bundle approval status
 */
router.get('/practices/:id/bundle-status', async (req, res) => {
  try {
    const { id } = req.params;

    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    if (!practice.bundle_sid) {
      return res.json({ status: 'not_created' });
    }

    // Create subaccount client
    const subClient = twilio(
      practice.twilio_account_sid,
      practice.twilio_auth_token
    );

    // Get bundle status
    const bundle = await subClient.numbers.v2.regulatoryCompliance
      .bundles(practice.bundle_sid)
      .fetch();

    // Update local status
    if (bundle.status !== practice.bundle_status) {
      await db.query(`
        UPDATE twilio_practices 
        SET bundle_status = $1,
            setup_step = CASE 
              WHEN $1 = 'twilio-approved' THEN 'bundle_approved'
              WHEN $1 = 'twilio-rejected' THEN 'bundle_rejected'
              ELSE setup_step
            END
        WHERE id = $2
      `, [bundle.status, id]);
    }

    res.json({
      bundleSid: bundle.sid,
      status: bundle.status,
      isApproved: bundle.status === 'twilio-approved',
      nextStep: bundle.status === 'twilio-approved' ? 'purchase_number' : 'await_approval',
    });
  } catch (error) {
    console.error('Error checking bundle status:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/practices/:id/twiml-app
 * Create TwiML App for the practice (required for voice calls)
 */
router.post('/practices/:id/twiml-app', async (req, res) => {
  try {
    const { id } = req.params;

    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    // Create subaccount client
    const subClient = twilio(
      practice.twilio_account_sid,
      practice.twilio_auth_token
    );

    // Create TwiML App
    const app = await subClient.applications.create({
      friendlyName: `${practice.practice_name} Voice App`,
      voiceUrl: `${BASE_URL}/webhooks/twiml?practice=${id}`,
      voiceMethod: 'POST',
      statusCallback: `${BASE_URL}/webhooks/status-callback?practice=${id}`,
      statusCallbackMethod: 'POST',
    });

    console.log(`✅ TwiML App created: ${app.sid}`);

    // Store in database
    await db.query(`
      INSERT INTO twilio_twiml_apps (
        practice_id, app_sid, friendly_name, voice_url
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (practice_id) DO UPDATE SET
        app_sid = $2, friendly_name = $3, voice_url = $4
    `, [id, app.sid, app.friendlyName, app.voiceUrl]);

    // Update practice
    await db.query(`
      UPDATE twilio_practices 
      SET twiml_app_sid = $1, setup_step = 'twiml_app_created'
      WHERE id = $2
    `, [app.sid, id]);

    res.json({
      success: true,
      appSid: app.sid,
      voiceUrl: app.voiceUrl,
      nextStep: 'purchase_number',
      message: 'TwiML App created. Ready to purchase phone numbers.',
    });
  } catch (error) {
    console.error('Error creating TwiML app:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/practices/:id/available-numbers
 * Search available numbers in practice's subaccount
 */
router.get('/practices/:id/available-numbers', async (req, res) => {
  try {
    const { id } = req.params;
    const { country = 'AU', type = 'local', areaCode, contains } = req.query;

    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    // For AU numbers, check bundle status
    if (country === 'AU' && practice.bundle_status !== 'twilio-approved') {
      return res.status(400).json({
        error: 'Regulatory bundle must be approved before searching AU numbers',
        bundleStatus: practice.bundle_status,
      });
    }

    // Create subaccount client
    const subClient = twilio(
      practice.twilio_account_sid,
      practice.twilio_auth_token
    );

    const typeMap = {
      local: 'local',
      mobile: 'mobile',
      tollFree: 'tollFree',
    };

    const options = { limit: 20 };
    if (areaCode) options.areaCode = areaCode;
    if (contains) options.contains = contains;

    const numbers = await subClient.availablePhoneNumbers(country)
      [typeMap[type] || 'local'].list(options);

    res.json(numbers.map(n => ({
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      region: n.region,
      locality: n.locality,
      capabilities: {
        voice: n.capabilities.voice,
        sms: n.capabilities.sms,
        mms: n.capabilities.mms,
      },
    })));
  } catch (error) {
    console.error('Error searching numbers:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/practices/:id/phone-numbers
 * Purchase a phone number for the practice
 */
router.post('/practices/:id/phone-numbers', async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber, friendlyName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    // Create subaccount client
    const subClient = twilio(
      practice.twilio_account_sid,
      practice.twilio_auth_token
    );

    // Purchase number
    const purchaseOptions = {
      phoneNumber,
      friendlyName: friendlyName || phoneNumber,
      voiceUrl: `${BASE_URL}/webhooks/twiml?practice=${id}`,
      voiceMethod: 'POST',
      statusCallback: `${BASE_URL}/webhooks/status-callback?practice=${id}`,
      statusCallbackMethod: 'POST',
    };

    // Add bundle SID for AU numbers
    if (phoneNumber.startsWith('+61') && practice.bundle_sid) {
      purchaseOptions.bundleSid = practice.bundle_sid;
    }

    const purchased = await subClient.incomingPhoneNumbers.create(purchaseOptions);

    console.log(`✅ Number purchased: ${purchased.phoneNumber}`);

    // Store in database
    const result = await db.query(`
      INSERT INTO phone_numbers (
        practice_id, phone_number_sid, phone_number, friendly_name,
        number_type, capabilities, voice_url, status_callback, 
        bundle_sid, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING *
    `, [
      id,
      purchased.sid,
      purchased.phoneNumber,
      purchased.friendlyName,
      phoneNumber.startsWith('+614') ? 'mobile' : 'local',
      JSON.stringify(purchased.capabilities),
      purchased.voiceUrl,
      purchased.statusCallback,
      practice.bundle_sid,
    ]);

    // Update practice setup step
    await db.query(`
      UPDATE twilio_practices 
      SET setup_step = 'number_purchased', setup_status = 'complete'
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      phoneNumber: result.rows[0],
      nextStep: 'configure_routing',
      message: 'Phone number purchased and configured.',
    });
  } catch (error) {
    console.error('Error purchasing number:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/practices/:id/setup-status
 * Get the current setup status for wizard UI
 */
router.get('/practices/:id/setup-status', async (req, res) => {
  try {
    const { id } = req.params;

    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    // Count phone numbers
    const numbersResult = await db.query(
      'SELECT COUNT(*) FROM phone_numbers WHERE practice_id = $1',
      [id]
    );

    // Count call flows
    const flowsResult = await db.query(
      'SELECT COUNT(*) FROM call_flows WHERE practice_id = $1',
      [id]
    );

    const steps = [
      { 
        id: 'subaccount', 
        label: 'Practice Registration',
        complete: !!practice.twilio_account_sid,
      },
      { 
        id: 'address', 
        label: 'Business Address',
        complete: !!practice.address_sid,
      },
      { 
        id: 'bundle', 
        label: 'Regulatory Compliance',
        complete: practice.bundle_status === 'twilio-approved',
        status: practice.bundle_status,
      },
      { 
        id: 'twiml_app', 
        label: 'Voice Configuration',
        complete: !!practice.twiml_app_sid,
      },
      { 
        id: 'number', 
        label: 'Phone Number',
        complete: parseInt(numbersResult.rows[0].count) > 0,
        count: parseInt(numbersResult.rows[0].count),
      },
      { 
        id: 'routing', 
        label: 'Call Routing',
        complete: parseInt(flowsResult.rows[0].count) > 0,
        count: parseInt(flowsResult.rows[0].count),
      },
    ];

    const currentStepIndex = steps.findIndex(s => !s.complete);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex].id : 'complete';

    res.json({
      practice: {
        id: practice.id,
        name: practice.practice_name,
        setupStatus: practice.setup_status,
        setupStep: practice.setup_step,
      },
      steps,
      currentStep,
      isComplete: currentStep === 'complete',
      completedSteps: steps.filter(s => s.complete).length,
      totalSteps: steps.length,
    });
  } catch (error) {
    console.error('Error getting setup status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
