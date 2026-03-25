/**
 * Stage 1: Business Address & Regulatory Setup
 * 
 * Australian phone number regulations require:
 * - A verified business address (Address SID)
 * - A regulatory bundle linking address to business identity
 * - Bundle must be approved before numbers can be purchased
 */

import { Router } from 'express';
import { client } from '../lib/twilio.js';
import db from '../lib/db.js';

const router = Router();

// =====================================================
// 1.2 CREATE BUSINESS ADDRESS
// =====================================================

/**
 * POST /api/twilio/addresses
 * Create a new business address for regulatory compliance
 */
router.post('/addresses', async (req, res) => {
  try {
    const {
      customerName,
      friendlyName,
      street,
      city,
      region,
      postalCode,
      isoCountry = 'AU',
    } = req.body;

    // Validate required fields
    if (!customerName || !street || !city || !region || !postalCode) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['customerName', 'street', 'city', 'region', 'postalCode'],
      });
    }

    // Create address in Twilio
    const address = await client.addresses.create({
      customerName,
      friendlyName: friendlyName || `${city} Office`,
      street,
      city,
      region,
      postalCode,
      isoCountry,
    });

    // Store in database
    await db.query(
      `INSERT INTO twilio_addresses 
        (address_sid, friendly_name, customer_name, street, city, region, postal_code, iso_country, validated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (address_sid) DO UPDATE SET
        friendly_name = EXCLUDED.friendly_name,
        validated = EXCLUDED.validated,
        updated_at = NOW()`,
      [address.sid, address.friendlyName, address.customerName, address.street, 
       address.city, address.region, address.postalCode, address.isoCountry, address.validated]
    );

    res.status(201).json({
      addressSid: address.sid,
      friendlyName: address.friendlyName,
      customerName: address.customerName,
      street: address.street,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      isoCountry: address.isoCountry,
      validated: address.validated,
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/twilio/addresses
 * List all business addresses
 */
router.get('/addresses', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT address_sid, friendly_name, customer_name, street, city, region, 
              postal_code, iso_country, validated, created_at
       FROM twilio_addresses
       ORDER BY created_at DESC`
    );

    res.json(result.rows.map(row => ({
      addressSid: row.address_sid,
      friendlyName: row.friendly_name,
      customerName: row.customer_name,
      street: row.street,
      city: row.city,
      region: row.region,
      postalCode: row.postal_code,
      isoCountry: row.iso_country,
      validated: row.validated,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Error listing addresses:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/addresses/:addressSid
 * Get address details
 */
router.get('/addresses/:addressSid', async (req, res) => {
  try {
    const { addressSid } = req.params;

    // Fetch from Twilio to get latest status
    const address = await client.addresses(addressSid).fetch();

    // Update local cache
    await db.query(
      `UPDATE twilio_addresses SET validated = $1, updated_at = NOW() WHERE address_sid = $2`,
      [address.validated, addressSid]
    );

    res.json({
      addressSid: address.sid,
      friendlyName: address.friendlyName,
      customerName: address.customerName,
      street: address.street,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      isoCountry: address.isoCountry,
      validated: address.validated,
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// =====================================================
// 1.3 CREATE REGULATORY BUNDLE
// =====================================================

/**
 * POST /api/twilio/regulatory-bundles
 * Create a regulatory bundle and submit for review
 */
router.post('/regulatory-bundles', async (req, res) => {
  try {
    const {
      friendlyName,
      addressSid,
      numberType = 'local',
      isoCountry = 'AU',
    } = req.body;

    if (!friendlyName || !addressSid) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['friendlyName', 'addressSid'],
      });
    }

    // Step 1: Get regulation SID for AU + number type
    const regulations = await client.numbers.v2.regulatoryCompliance
      .regulations
      .list({ isoCountry, numberType });

    if (regulations.length === 0) {
      return res.status(400).json({
        error: `No regulations found for ${isoCountry} ${numberType} numbers`,
      });
    }

    const regulationSid = regulations[0].sid;

    // Step 2: Create the bundle
    const bundle = await client.numbers.v2.regulatoryCompliance
      .bundles
      .create({
        friendlyName,
        email: process.env.COMPLIANCE_EMAIL || 'compliance@axis.com.au',
        regulationSid,
        isoCountry,
        numberType,
      });

    // Step 3: Assign address to bundle
    await client.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .itemAssignments
      .create({ objectSid: addressSid });

    // Step 4: Submit for review
    const evaluation = await client.numbers.v2.regulatoryCompliance
      .bundles(bundle.sid)
      .evaluations
      .create();

    // Store in database
    await db.query(
      `INSERT INTO twilio_regulatory_bundles 
        (bundle_sid, friendly_name, status, regulation_sid, iso_country, number_type, address_sid)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [bundle.sid, bundle.friendlyName, bundle.status, regulationSid, isoCountry, numberType, addressSid]
    );

    res.status(201).json({
      bundleSid: bundle.sid,
      friendlyName: bundle.friendlyName,
      status: bundle.status,
      regulationSid,
      isoCountry,
      numberType,
      addressSid,
      evaluationSid: evaluation.sid,
      message: 'Bundle created and submitted for review. Check status periodically.',
    });
  } catch (error) {
    console.error('Error creating regulatory bundle:', error);
    res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/twilio/regulatory-bundles
 * List all regulatory bundles
 */
router.get('/regulatory-bundles', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT bundle_sid, friendly_name, status, regulation_sid, iso_country, 
              number_type, address_sid, created_at
       FROM twilio_regulatory_bundles
       ORDER BY created_at DESC`
    );

    res.json(result.rows.map(row => ({
      bundleSid: row.bundle_sid,
      friendlyName: row.friendly_name,
      status: row.status,
      regulationSid: row.regulation_sid,
      isoCountry: row.iso_country,
      numberType: row.number_type,
      addressSid: row.address_sid,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Error listing bundles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twilio/regulatory-bundles/:bundleSid/status
 * Check bundle approval status (poll this until approved)
 */
router.get('/regulatory-bundles/:bundleSid/status', async (req, res) => {
  try {
    const { bundleSid } = req.params;

    // Fetch latest status from Twilio
    const bundle = await client.numbers.v2.regulatoryCompliance
      .bundles(bundleSid)
      .fetch();

    // Update local status
    await db.query(
      `UPDATE twilio_regulatory_bundles SET status = $1, updated_at = NOW() WHERE bundle_sid = $2`,
      [bundle.status, bundleSid]
    );

    res.json({
      bundleSid: bundle.sid,
      friendlyName: bundle.friendlyName,
      status: bundle.status,
      statusDescription: getStatusDescription(bundle.status),
      validUntil: bundle.validUntil,
    });
  } catch (error) {
    console.error('Error checking bundle status:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

/**
 * Helper: Get human-readable status description
 */
function getStatusDescription(status) {
  const descriptions = {
    'draft': 'Bundle created but not yet submitted for review',
    'pending-review': 'Submitted and awaiting Twilio review (typically 1-2 business days)',
    'in-review': 'Currently being reviewed by Twilio compliance team',
    'twilio-approved': '✅ Approved! Ready to purchase phone numbers',
    'twilio-rejected': '❌ Rejected. Review feedback and resubmit with corrections',
    'provisionally-approved': 'Temporarily approved, pending additional verification',
  };
  return descriptions[status] || status;
}

export default router;
