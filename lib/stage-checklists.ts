/**
 * Sales Chart Stage Checklists Configuration
 * Direct mapping of the client's official 5-stage Sales Chart activities into actionable checklist items.
 */

export interface StageChecklistItem {
  key: string;
  label: string;
  description: string;
  isRequired?: boolean;
}

export interface StageConfig {
  stageKey: string;
  stageName: string;
  stageNum: number;
  slaHours: number;
  items: StageChecklistItem[];
}

export const SALES_CHART_STAGES: Record<string, StageConfig> = {
  stage_1_lead_gen: {
    stageKey: 'stage_1_lead_gen',
    stageName: 'Lead Generation',
    stageNum: 1,
    slaHours: 24,
    items: [
      { key: 'homeowner_name', label: 'Homeowner Full Name', description: 'Captured verified primary contact name', isRequired: true },
      { key: 'phone_number', label: 'Phone Number', description: 'Working mobile or primary telephone number', isRequired: true },
      { key: 'address', label: 'Property Address', description: 'Valid street address for satellite/site inspection', isRequired: true },
      { key: 'email', label: 'Email Address', description: 'Collected for proposal delivery & digital signature', isRequired: false },
      { key: 'service_needed', label: 'Service Needed', description: 'Specific type (Tile Reroof, Shingle Repair, etc.)', isRequired: true },
      { key: 'notes_photos', label: 'Photos / Field Notes', description: 'Initial exterior photos or rep canvassing observations', isRequired: false },
      { key: 'source_tagged', label: 'Lead Source Tagged', description: 'Source accurately tagged (Door Knock, Web, Yelp, etc.)', isRequired: true },
    ],
  },
  stage_2_initial_contact: {
    stageKey: 'stage_2_initial_contact',
    stageName: 'Initial Contact',
    stageNum: 2,
    slaHours: 48,
    items: [
      { key: 'call_sms_logged', label: 'Call / SMS Logged within 24–48h', description: 'Direct customer contact logged in CRM activity feed', isRequired: true },
      { key: 'address_confirmed', label: 'Property Address Verified', description: 'Confirmed address, gate codes, and access details', isRequired: true },
      { key: 'service_confirmed', label: 'Roof Issue & Scope Confirmed', description: 'Discussed active leaks, age of roof, and client goals', isRequired: true },
      { key: 'estimate_booked', label: '12-Point Roof Inspection Booked', description: 'Calendar appointment created with assigned inspector', isRequired: true },
    ],
  },
  stage_3_site_visit_estimate: {
    stageKey: 'stage_3_site_visit_estimate',
    stageName: 'Site Visit + Estimate',
    stageNum: 3,
    slaHours: 72,
    items: [
      { key: 'inspection_done', label: '12-Point Roof Inspection Performed', description: 'Physical roof walk or drone inspection completed', isRequired: true },
      { key: 'photos_uploaded', label: 'Drone & Damage Photos Uploaded', description: 'High-res photos of valleys, flashings, and decking documented', isRequired: true },
      { key: 'materials_financing', label: 'Materials & Financing Explained', description: 'Presented underlayment options and 0% APR financing', isRequired: true },
      { key: 'estimate_generated', label: 'Official Estimate Created via Template', description: 'Generated with standardized scope of work', isRequired: true },
    ],
  },
  stage_4_closing: {
    stageKey: 'stage_4_closing',
    stageName: 'Closing',
    stageNum: 4,
    slaHours: 48,
    items: [
      { key: 'followup_completed', label: '48-Hour Follow-Up Completed', description: 'Follow-up call or text sent to answer homeowner questions', isRequired: true },
      { key: 'financing_presented', label: 'Financing / Promos Presented', description: 'Reviewed monthly installment options and any discounts', isRequired: false },
      { key: 'proposal_delivered', label: 'Formal Proposal & Agreement Sent', description: 'Digital proposal link shared with homeowner', isRequired: true },
      { key: 'contract_signed', label: 'Agreement Digitally Signed', description: 'Homeowner signature executed on digital contract', isRequired: true },
    ],
  },
  stage_5_completion_followup: {
    stageKey: 'stage_5_completion_followup',
    stageName: 'Job Completion & Follow-Up',
    stageNum: 5,
    slaHours: 168,
    items: [
      { key: 'project_completed', label: 'Roof Project Installed & Cleaned', description: 'Full installation finished with ground magnetic sweep', isRequired: true },
      { key: 'permit_finaled', label: 'City Building Permit Final Passed', description: 'Building inspector sign-off recorded', isRequired: false },
      { key: 'photos_documented', label: 'Before & After Photos Uploaded', description: 'Complete photographic archive saved to job file', isRequired: true },
      { key: 'warranty_issued', label: '50-Year Warranty Certificate Issued', description: 'Manufacturer & workmanship warranty registered', isRequired: true },
      { key: 'review_requested', label: '5-Star Google / Yelp Review Requested', description: 'Direct review invite sent via SMS / email', isRequired: true },
    ],
  },
};

/**
 * Automatically computes completion state for items that have canonical data backing in the CRM
 */
export function getAutoCompletedKeysForLead(lead: any): Set<string> {
  const autoCompleted = new Set<string>();

  // Stage 1
  if (lead.full_name && lead.full_name.trim()) autoCompleted.add('homeowner_name');
  if (lead.phone && lead.phone.trim()) autoCompleted.add('phone_number');
  if (lead.address && lead.address.trim()) autoCompleted.add('address');
  if (lead.email && lead.email.trim()) autoCompleted.add('email');
  if (lead.service_type && lead.service_type.trim()) autoCompleted.add('service_needed');
  if (lead.lead_source || lead.source_type) autoCompleted.add('source_tagged');
  if (lead.photo_count > 0 || (lead.notes && lead.notes.trim())) autoCompleted.add('notes_photos');

  // Stage 2
  if (lead.initial_contacted_at) autoCompleted.add('call_sms_logged');
  if (lead.address_confirmed) autoCompleted.add('address_confirmed');
  if (lead.service_type) autoCompleted.add('service_confirmed');
  if (lead.site_visit_scheduled_at) autoCompleted.add('estimate_booked');

  // Stage 3
  if (lead.inspection_id) autoCompleted.add('inspection_done');
  if (lead.photo_count > 0) autoCompleted.add('photos_uploaded');
  if (lead.financing_interested || lead.discount_applied) autoCompleted.add('materials_financing');
  if (lead.estimate_id) autoCompleted.add('estimate_generated');

  // Stage 4
  if (lead.proposal_sent_at) autoCompleted.add('proposal_delivered');
  if (lead.contract_signed_at || lead.contract_status === 'client_signed' || lead.contract_status === 'fully_executed') {
    autoCompleted.add('contract_signed');
  }
  if (lead.financing_interested) autoCompleted.add('financing_presented');

  // Stage 5
  if (lead.job_completed_at || lead.job_status === 'complete') autoCompleted.add('project_completed');
  if (lead.photo_count >= 3) autoCompleted.add('photos_documented');
  if (lead.has_warranty || lead.warranty_number) autoCompleted.add('warranty_issued');
  if (lead.has_review) autoCompleted.add('review_requested');

  return autoCompleted;
}
