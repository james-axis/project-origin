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
 * Create a new practice
 * - useSubaccount=false: Database record only (uses main Axis account)
 * - useSubaccount=true: Creates Twilio subaccount for isolated billing/risk
 */
router.post('/practices', async (req, res) => {
  try {
    const { 
      practiceName, 
      contactName, 
      contactEmail,
      abn,
      afslNumber,
      useSubaccount = false,
    } = req.body;

    if (!practiceName || !contactEmail) {
      return res.status(400).json({ 
        error: 'practiceName and contactEmail are required' 
      });
    }

    console.log(`📋 Creating practice: ${practiceName} (subaccount: ${useSubaccount})`);

    let twilioAccountSid = null;
    let twilioAuthToken = null;

    // Create Twilio subaccount if requested (Separate Organisation)
    if (useSubaccount) {
      console.log('🔧 Creating Twilio subaccount...');
      try {
        const subaccount = await twilioClient.api.accounts.create({
          friendlyName: practiceName,
        });
        twilioAccountSid = subaccount.sid;
        twilioAuthToken = subaccount.authToken;
        console.log(`✅ Subaccount created: ${twilioAccountSid}`);
      } catch (twilioError) {
        console.error('Twilio subaccount creation failed:', twilioError);
        return res.status(400).json({ 
          error: `Failed to create Twilio subaccount: ${twilioError.message}`,
          details: 'This may be due to account limits. Try upgrading from trial or contact Twilio support.',
        });
      }
    }

    // Create database record
    const result = await db.query(`
      INSERT INTO twilio_practices (
        practice_name, contact_name, contact_email, abn, afsl_number,
        is_subaccount, twilio_account_sid, twilio_auth_token,
        setup_step, setup_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      practiceName,
      contactName,
      contactEmail,
      abn,
      afslNumber,
      useSubaccount,
      twilioAccountSid,
      twilioAuthToken,
      'practice_created',
      'in_progress'
    ]);

    console.log(`✅ Practice created: ${result.rows[0].id}`);

    res.json({
      success: true,
      practice: result.rows[0],
      isSubaccount: useSubaccount,
      nextStep: 'phone_number',
      message: useSubaccount 
        ? 'Practice created with separate Twilio subaccount. Next: Select a phone number.'
        : 'Practice created under Axis organisation. Next: Select a phone number.',
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
 * For subaccounts, also closes the Twilio subaccount
 */
router.delete('/practices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get practice details
    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];
    const isSubaccount = practice.is_subaccount && practice.twilio_account_sid;

    console.log(`🗑️ Deleting practice: ${practice.practice_name} (subaccount: ${isSubaccount})`);

    // Get associated phone numbers to release
    const numbersResult = await db.query(
      'SELECT phone_number_sid FROM phone_numbers WHERE practice_id = $1',
      [id]
    );

    // Use subaccount client if applicable
    const client = isSubaccount
      ? twilio(practice.twilio_account_sid, practice.twilio_auth_token)
      : twilioClient;

    // Release numbers from Twilio
    for (const num of numbersResult.rows) {
      try {
        await client.incomingPhoneNumbers(num.phone_number_sid).remove();
        console.log(`✅ Released number: ${num.phone_number_sid}`);
      } catch (err) {
        console.error(`⚠️ Failed to release ${num.phone_number_sid}:`, err.message);
      }
    }

    // Close the subaccount if applicable
    if (isSubaccount) {
      try {
        // Setting status to 'closed' permanently closes the subaccount
        await twilioClient.api.accounts(practice.twilio_account_sid)
          .update({ status: 'closed' });
        console.log(`✅ Closed subaccount: ${practice.twilio_account_sid}`);
      } catch (err) {
        console.error(`⚠️ Failed to close subaccount:`, err.message);
        // Continue with deletion even if subaccount close fails
      }
    }

    // Delete practice (cascades to phone_numbers, call_flows)
    await db.query('DELETE FROM twilio_practices WHERE id = $1', [id]);

    res.json({ 
      success: true, 
      message: isSubaccount 
        ? 'Practice and Twilio subaccount deleted' 
        : 'Practice deleted',
    });
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
 * Purchase a phone number for the practice
 * 
 * For Axis Organisation (is_subaccount=false):
 *   - Purchase and keep in main Axis account
 * 
 * For Separate Organisation (is_subaccount=true):
 *   - Purchase from main account (uses Axis regulatory bundle)
 *   - Transfer number to practice's Twilio subaccount (for billing/risk isolation)
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
    const isSubaccount = practice.is_subaccount && practice.twilio_account_sid;

    console.log(`📞 Purchasing number for practice: ${practice.practice_name} (subaccount: ${isSubaccount})`);

    // Step 1: Purchase number from main Axis account
    const purchaseOptions = {
      phoneNumber,
      friendlyName: friendlyName || `${practice.practice_name} - ${phoneNumber}`,
      voiceUrl: `${BASE_URL}/webhooks/twiml?practice=${id}`,
      voiceMethod: 'POST',
      statusCallback: `${BASE_URL}/webhooks/status-callback?practice=${id}`,
      statusCallbackMethod: 'POST',
    };

    let purchased = await twilioClient.incomingPhoneNumbers.create(purchaseOptions);
    console.log(`✅ Number purchased from main account: ${purchased.phoneNumber}`);

    let finalNumberSid = purchased.sid;

    // Step 2: If practice is a subaccount, transfer the number
    if (isSubaccount) {
      console.log(`🔄 Transferring number to subaccount: ${practice.twilio_account_sid}`);
      try {
        // Transfer number to subaccount
        const transferred = await twilioClient.incomingPhoneNumbers(purchased.sid)
          .update({
            accountSid: practice.twilio_account_sid,
          });
        
        finalNumberSid = transferred.sid;
        console.log(`✅ Number transferred to subaccount: ${transferred.sid}`);

        // Update webhook URLs to use subaccount credentials
        // The number is now owned by the subaccount, so webhooks will authenticate against it
        const subaccountClient = twilio(practice.twilio_account_sid, practice.twilio_auth_token);
        await subaccountClient.incomingPhoneNumbers(transferred.sid).update({
          voiceUrl: `${BASE_URL}/webhooks/twiml?practice=${id}`,
          voiceMethod: 'POST',
          statusCallback: `${BASE_URL}/webhooks/status-callback?practice=${id}`,
          statusCallbackMethod: 'POST',
        });
        console.log(`✅ Webhook URLs configured on subaccount number`);
      } catch (transferError) {
        console.error('❌ Number transfer failed:', transferError.message);
        // Rollback: release the number from main account
        try {
          await twilioClient.incomingPhoneNumbers(purchased.sid).remove();
          console.log('🔄 Rolled back: number released from main account');
        } catch (rollbackError) {
          console.error('⚠️ Rollback failed:', rollbackError.message);
        }
        throw new Error(`Failed to transfer number to subaccount: ${transferError.message}`);
      }
    }

    // Store in database with practice_id
    const result = await db.query(`
      INSERT INTO phone_numbers (
        practice_id, phone_number_sid, phone_number, friendly_name,
        number_type, capabilities, voice_url, status_callback, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [
      id,
      finalNumberSid,
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
      isSubaccount,
      transferredToSubaccount: isSubaccount,
      nextStep: 'call_routing',
      message: isSubaccount 
        ? 'Phone number purchased and transferred to practice subaccount. Next: Set up call routing.'
        : 'Phone number purchased. Next: Set up call routing.',
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

    // Get the practice
    const practiceResult = await db.query(
      'SELECT * FROM twilio_practices WHERE id = $1',
      [id]
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    const practice = practiceResult.rows[0];
    const isSubaccount = practice.is_subaccount && practice.twilio_account_sid;

    // Get the number
    const numResult = await db.query(
      'SELECT * FROM phone_numbers WHERE id = $1 AND practice_id = $2',
      [numberId, id]
    );

    if (numResult.rows.length === 0) {
      return res.status(404).json({ error: 'Phone number not found' });
    }

    const num = numResult.rows[0];

    // Use subaccount client if applicable
    const client = isSubaccount
      ? twilio(practice.twilio_account_sid, practice.twilio_auth_token)
      : twilioClient;

    // Release from Twilio
    await client.incomingPhoneNumbers(num.phone_number_sid).remove();
    console.log(`✅ Number released: ${num.phone_number} (subaccount: ${isSubaccount})`);

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

/**
 * POST /api/twilio/account/setup-au-bundle
 * Combined one-click AU regulatory setup
 * Creates End-User + assigns to bundle for AU number compliance
 */
router.post('/account/setup-au-bundle', async (req, res) => {
  try {
    const {
      customerName = 'Axis Insurance Pty Ltd',
      street,
      city,
      region,
      postalCode,
      numberType = 'local',
      email,
    } = req.body;

    if (!street || !city || !region || !postalCode) {
      return res.status(400).json({ 
        error: 'street, city, region, and postalCode are required',
        example: {
          customerName: 'Axis Insurance Pty Ltd',
          street: '123 George Street',
          city: 'Sydney',
          region: 'NSW',
          postalCode: '2000',
          numberType: 'local',
          email: 'compliance@axisinsurance.com.au'
        }
      });
    }

    console.log('🚀 Starting AU regulatory bundle setup...');

    // Step 1: Check if we already have an approved bundle
    const existingBundles = await twilioClient.numbers.v2.regulatoryCompliance.bundles.list({
      isoCountry: 'AU',
    });
    
    const approvedBundle = existingBundles.find(b => b.status === 'twilio-approved');
    if (approvedBundle) {
      return res.json({
        success: true,
        alreadySetup: true,
        bundleSid: approvedBundle.sid,
        status: approvedBundle.status,
        message: 'AU regulatory bundle already approved. Ready to purchase AU numbers.',
      });
    }

    const pendingBundle = existingBundles.find(b => b.status === 'pending-review');
    if (pendingBundle) {
      return res.json({
        success: true,
        alreadySetup: true,
        bundleSid: pendingBundle.sid,
        status: pendingBundle.status,
        message: 'AU regulatory bundle already submitted and pending review.',
      });
    }

    // Step 2: Get regulation requirements
    console.log('📋 Looking up AU regulations...');
    const regulations = await twilioClient.numbers.v2.regulatoryCompliance
      .regulations.list({ isoCountry: 'AU', numberType });
    
    if (regulations.length === 0) {
      return res.status(400).json({ error: 'No regulations found for AU ' + numberType + ' numbers' });
    }
    const regulationSid = regulations[0].sid;
    console.log(`✅ Regulation found: ${regulationSid}`);

    // Step 3: Create End-User (business entity)
    console.log('👤 Creating End-User...');
    const endUser = await twilioClient.numbers.v2.regulatoryCompliance.endUsers.create({
      friendlyName: customerName,
      type: 'business',
      attributes: {
        business_name: customerName,
        business_registration_number: '', // ABN - optional for now
        business_type: 'Corporation',
        business_industry: 'Insurance',
        business_registration_authority: 'ASIC',
        business_registration_identifier: '',
      },
    });
    console.log(`✅ End-User created: ${endUser.sid}`);

    // Step 4: Create Supporting Document (Address)
    console.log('📄 Creating Supporting Document (Address)...');
    const supportingDoc = await twilioClient.numbers.v2.regulatoryCompliance.supportingDocuments.create({
      friendlyName: `${customerName} - Business Address`,
      type: 'business_address',
      attributes: {
        address_sids: '', // Will link after creating address if needed
        business_name: customerName,
        street: street,
        city: city,
        region: region,
        postal_code: postalCode,
        iso_country: 'AU',
      },
    });
    console.log(`✅ Supporting Document created: ${supportingDoc.sid}`);

    // Step 5: Create bundle
    console.log('📦 Creating regulatory bundle...');
    const bundle = await twilioClient.numbers.v2.regulatoryCompliance.bundles.create({
      friendlyName: `Axis - AU ${numberType} Numbers`,
      email: email || process.env.AXIS_COMPLIANCE_EMAIL || 'compliance@axis.com.au',
      isoCountry: 'AU',
      numberType,
      regulationSid,
    });
    console.log(`✅ Bundle created: ${bundle.sid}`);

    // Step 6: Assign End-User to bundle
    console.log('🔗 Assigning End-User to bundle...');
    await twilioClient.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .itemAssignments.create({
        objectSid: endUser.sid,
      });
    console.log('✅ End-User assigned to bundle');

    // Step 7: Assign Supporting Document to bundle
    console.log('🔗 Assigning Supporting Document to bundle...');
    await twilioClient.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .itemAssignments.create({
        objectSid: supportingDoc.sid,
      });
    console.log('✅ Supporting Document assigned to bundle');

    // Step 8: Submit for review
    console.log('📤 Submitting bundle for review...');
    const updatedBundle = await twilioClient.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .update({ status: 'pending-review' });
    console.log(`✅ Bundle submitted: ${updatedBundle.status}`);

    // Store in database for reference
    await db.query(`
      INSERT INTO twilio_regulatory_bundles (bundle_sid, friendly_name, status, regulation_sid, iso_country, number_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (bundle_sid) DO NOTHING
    `, [bundle.sid, `Axis - AU ${numberType} Numbers`, updatedBundle.status, regulationSid, 'AU', numberType]);

    res.json({
      success: true,
      endUserSid: endUser.sid,
      supportingDocSid: supportingDoc.sid,
      bundleSid: bundle.sid,
      status: updatedBundle.status,
      message: 'AU regulatory bundle created and submitted for review. Approval typically takes 1-3 business days. You will be able to purchase AU numbers once approved.',
      nextSteps: [
        'Wait for Twilio to approve the bundle (check email)',
        'Once approved, AU numbers will be available for purchase in the wizard',
      ],
    });
  } catch (error) {
    console.error('Error setting up AU bundle:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
