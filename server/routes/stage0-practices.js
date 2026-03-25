/**
 * Stage 0: Practice Management (Single-Account Architecture)
 * 
 * All practices use the main Axis Twilio account:
 * - One regulatory bundle for Axis (set up once)
 * - Phone numbers purchased from main account
 * - Practices tracked via practice_id column
 * - No subaccount complexity
 */

import { Router } from 'express';
import twilio from 'twilio';
import db from '../lib/db.js';

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://project-origin-production-1216.up.railway.app';

// Single Twilio client for all operations
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// =====================================================
// PRACTICE MANAGEMENT (Database only, no Twilio subaccounts)
// =====================================================

/**
 * GET /api/twilio/practices
 * List all practices
 */
router.get('/practices', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM phone_numbers WHERE practice_id = p.id) as phone_count,
        (SELECT COUNT(*) FROM call_flows WHERE practice_id = p.id) as flow_count
      FROM twilio_practices p
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

    // Get call flows
    const flowsResult = await db.query(
      'SELECT * FROM call_flows WHERE practice_id = $1',
      [id]
    );

    res.json({
      ...practice,
      phoneNumbers: numbersResult.rows,
      callFlows: flowsResult.rows,
    });
  } catch (error) {
    console.error('Error getting practice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/practices
 * Create a new practice (database record only - no Twilio subaccount)
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

    // Just create database record - no Twilio subaccount
    const result = await db.query(`
      INSERT INTO twilio_practices (
        practice_name, contact_name, contact_email, abn, afsl_number,
        setup_step, setup_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      practiceName,
      contactName,
      contactEmail,
      abn,
      afslNumber,
      'practice_created',
      'in_progress'
    ]);

    console.log(`✅ Practice created: ${result.rows[0].id}`);

    res.json({
      success: true,
      practice: result.rows[0],
      nextStep: 'phone_number',
      message: 'Practice created. Next: Select a phone number.',
    });
  } catch (error) {
    console.error('Error creating practice:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * PATCH /api/twilio/practices/:id
 * Update practice details
 */
router.patch('/practices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { practiceName, contactName, contactEmail, abn, afslNumber } = req.body;

    const result = await db.query(`
      UPDATE twilio_practices 
      SET practice_name = COALESCE($1, practice_name),
          contact_name = COALESCE($2, contact_name),
          contact_email = COALESCE($3, contact_email),
          abn = COALESCE($4, abn),
          afsl_number = COALESCE($5, afsl_number),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [practiceName, contactName, contactEmail, abn, afslNumber, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    res.json({ success: true, practice: result.rows[0] });
  } catch (error) {
    console.error('Error updating practice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/twilio/practices/:id
 * Delete a practice (and release associated numbers)
 */
router.delete('/practices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get associated phone numbers to release
    const numbersResult = await db.query(
      'SELECT phone_number_sid FROM phone_numbers WHERE practice_id = $1',
      [id]
    );

    // Release numbers from Twilio
    for (const num of numbersResult.rows) {
      try {
        await twilioClient.incomingPhoneNumbers(num.phone_number_sid).remove();
        console.log(`Released number: ${num.phone_number_sid}`);
      } catch (err) {
        console.error(`Failed to release ${num.phone_number_sid}:`, err.message);
      }
    }

    // Delete practice (cascades to phone_numbers, call_flows)
    await db.query('DELETE FROM twilio_practices WHERE id = $1', [id]);

    res.json({ success: true, message: 'Practice deleted' });
  } catch (error) {
    console.error('Error deleting practice:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PHONE NUMBER MANAGEMENT (Main Account)
// =====================================================

/**
 * GET /api/twilio/practices/:id/available-numbers
 * Search available numbers from main Axis account
 */
router.get('/practices/:id/available-numbers', async (req, res) => {
  try {
    const { id } = req.params;
    const { country = 'AU', type = 'local', areaCode, contains } = req.query;

    // Verify practice exists
    const practiceResult = await db.query(
      'SELECT id FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const typeMap = {
      local: 'local',
      mobile: 'mobile',
      tollFree: 'tollFree',
    };

    const options = { limit: 20 };
    if (areaCode) options.areaCode = areaCode;
    if (contains) options.contains = contains;

    const numbers = await twilioClient.availablePhoneNumbers(country)
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
 * Purchase a phone number for the practice (from main account)
 */
router.post('/practices/:id/phone-numbers', async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber, friendlyName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    // Verify practice exists
    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];

    // Purchase number from main Axis account
    const purchaseOptions = {
      phoneNumber,
      friendlyName: friendlyName || `${practice.practice_name} - ${phoneNumber}`,
      voiceUrl: `${BASE_URL}/webhooks/twiml?practice=${id}`,
      voiceMethod: 'POST',
      statusCallback: `${BASE_URL}/webhooks/status-callback?practice=${id}`,
      statusCallbackMethod: 'POST',
    };

    const purchased = await twilioClient.incomingPhoneNumbers.create(purchaseOptions);

    console.log(`✅ Number purchased: ${purchased.phoneNumber} for practice ${practice.practice_name}`);

    // Store in database with practice_id
    const result = await db.query(`
      INSERT INTO phone_numbers (
        practice_id, phone_number_sid, phone_number, friendly_name,
        number_type, capabilities, voice_url, status_callback, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
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
    ]);

    // Update practice setup step
    await db.query(`
      UPDATE twilio_practices 
      SET setup_step = 'number_purchased'
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      phoneNumber: result.rows[0],
      nextStep: 'call_routing',
      message: 'Phone number purchased. Next: Set up call routing.',
    });
  } catch (error) {
    console.error('Error purchasing number:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * DELETE /api/twilio/practices/:id/phone-numbers/:numberId
 * Release a phone number
 */
router.delete('/practices/:id/phone-numbers/:numberId', async (req, res) => {
  try {
    const { id, numberId } = req.params;

    // Get the number
    const numResult = await db.query(
      'SELECT * FROM phone_numbers WHERE id = $1 AND practice_id = $2',
      [numberId, id]
    );

    if (numResult.rows.length === 0) {
      return res.status(404).json({ error: 'Phone number not found' });
    }

    const num = numResult.rows[0];

    // Release from Twilio
    await twilioClient.incomingPhoneNumbers(num.phone_number_sid).remove();

    // Delete from database
    await db.query('DELETE FROM phone_numbers WHERE id = $1', [numberId]);

    res.json({ success: true, message: 'Phone number released' });
  } catch (error) {
    console.error('Error releasing number:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// =====================================================
// SETUP STATUS (Simplified for 3-step wizard)
// =====================================================

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

    const hasNumber = parseInt(numbersResult.rows[0].count) > 0;
    const hasFlow = parseInt(flowsResult.rows[0].count) > 0;

    // Simplified 3-step wizard
    const steps = [
      { 
        id: 'practice', 
        label: 'Practice details',
        description: 'Register your practice',
        complete: true, // Always complete if we have a practice record
      },
      { 
        id: 'number', 
        label: 'Phone number',
        description: 'Purchase a number',
        complete: hasNumber,
        count: parseInt(numbersResult.rows[0].count),
      },
      { 
        id: 'routing', 
        label: 'Call routing',
        description: 'Set up IVR',
        complete: hasFlow,
        count: parseInt(flowsResult.rows[0].count),
      },
    ];

    const currentStepIndex = steps.findIndex(s => !s.complete);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex].id : 'complete';

    // Update setup_status if complete
    if (currentStep === 'complete' && practice.setup_status !== 'complete') {
      await db.query(
        'UPDATE twilio_practices SET setup_status = $1 WHERE id = $2',
        ['complete', id]
      );
    }

    res.json({
      practice: {
        id: practice.id,
        name: practice.practice_name,
        setupStatus: currentStep === 'complete' ? 'complete' : practice.setup_status,
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

// =====================================================
// AXIS ACCOUNT REGULATORY SETUP (One-time, not per practice)
// =====================================================

/**
 * GET /api/twilio/account/regulatory-status
 * Check if Axis account has AU regulatory bundle approved
 */
router.get('/account/regulatory-status', async (req, res) => {
  try {
    // Check for approved bundles
    const bundles = await twilioClient.numbers.v2.regulatoryCompliance.bundles.list({
      status: 'twilio-approved',
      isoCountry: 'AU',
    });

    const hasApprovedBundle = bundles.length > 0;

    res.json({
      hasApprovedBundle,
      bundles: bundles.map(b => ({
        sid: b.sid,
        friendlyName: b.friendlyName,
        status: b.status,
        numberType: b.numberType,
      })),
      message: hasApprovedBundle 
        ? 'AU numbers available' 
        : 'Set up regulatory bundle to purchase AU numbers',
    });
  } catch (error) {
    console.error('Error checking regulatory status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/account/regulatory-address
 * Create Axis business address for AU compliance (one-time setup)
 */
router.post('/account/regulatory-address', async (req, res) => {
  try {
    const { customerName, street, city, region, postalCode } = req.body;

    const address = await twilioClient.addresses.create({
      customerName: customerName || 'Axis Insurance Pty Ltd',
      street,
      city,
      region,
      postalCode,
      isoCountry: 'AU',
      friendlyName: 'Axis - Business Address',
    });

    console.log(`✅ Axis address created: ${address.sid}`);

    res.json({
      success: true,
      addressSid: address.sid,
      address,
      nextStep: 'regulatory_bundle',
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * POST /api/twilio/account/regulatory-bundle
 * Create and submit Axis regulatory bundle (one-time setup)
 */
router.post('/account/regulatory-bundle', async (req, res) => {
  try {
    const { addressSid, numberType = 'local' } = req.body;

    if (!addressSid) {
      return res.status(400).json({ error: 'addressSid is required' });
    }

    // Get regulation SID for AU
    const regulations = await twilioClient.numbers.v2.regulatoryCompliance
      .regulations.list({ isoCountry: 'AU', numberType });
    
    if (regulations.length === 0) {
      return res.status(400).json({ error: 'No regulations found for AU' });
    }

    const regulationSid = regulations[0].sid;

    // Create bundle
    const bundle = await twilioClient.numbers.v2.regulatoryCompliance.bundles.create({
      friendlyName: `Axis - AU ${numberType} Numbers`,
      email: process.env.AXIS_COMPLIANCE_EMAIL || 'compliance@axis.com.au',
      isoCountry: 'AU',
      numberType,
      regulationSid,
    });

    // Assign address to bundle
    await twilioClient.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .itemAssignments.create({
        objectSid: addressSid,
      });

    // Submit for review
    await twilioClient.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .update({ status: 'pending-review' });

    console.log(`✅ Axis bundle submitted: ${bundle.sid}`);

    res.json({
      success: true,
      bundleSid: bundle.sid,
      status: 'pending-review',
      message: 'Regulatory bundle submitted. Approval typically takes 1-3 business days.',
    });
  } catch (error) {
    console.error('Error creating bundle:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
