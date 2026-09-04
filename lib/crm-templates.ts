/**
 * Rise Up Roofing & Construction — Customer Communication Templates
 * 
 * Pre-built SMS and Email notifications with dynamic merge tags.
 */

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'both';
  subject?: string;
  body: string;
  description: string;
}

export const ROOFING_TEMPLATES: MessageTemplate[] = [
  {
    id: 'inspection_confirmed',
    name: 'Roof Inspection Confirmed',
    type: 'both',
    subject: 'Roof Inspection Confirmed — Rise Up Roofing',
    body: 'Hi {customer_name}, this is {rep_name} with Rise Up Roofing. Your roof inspection at {address} is confirmed for {date_time}. We will inspect all valleys, flashings, underlayment, and take aerial drone imagery. Call us at (760) 622-1230 if you need to adjust.',
    description: 'Sent after an in-field roof inspection is booked.',
  },
  {
    id: 'proposal_ready',
    name: 'Estimate & Proposal Ready for Review',
    type: 'both',
    subject: 'Your Rise Up Roofing Proposal & Warranty Options',
    body: 'Hi {customer_name}, your custom roofing proposal for {address} is ready! You can review your itemized scope, 50-year warranty, and 0% APR financing options directly on your phone: {proposal_link}. Let us know if you have any questions!',
    description: 'Shares the public digital proposal portal with the homeowner.',
  },
  {
    id: 'permit_approved',
    name: 'City Building Permit Issued',
    type: 'both',
    subject: 'Building Permit Approved — Rise Up Roofing',
    body: 'Great news {customer_name}! The city building department has officially approved the roofing permit for {address}. We have authorized material release from our distributor and will confirm your delivery date shortly.',
    description: 'Keeps homeowner informed once the city approves the permit.',
  },
  {
    id: 'material_delivery',
    name: 'Material Delivery & Driveway Notice',
    type: 'sms',
    body: 'Rise Up Roofing Alert: Your roofing materials are scheduled for delivery on {date_time}. Please ensure the driveway is clear of parked cars and trash bins so the supplier boom truck can safely load the roof.',
    description: 'Prepares homeowner for shingle or tile delivery.',
  },
  {
    id: 'crew_starting',
    name: 'Job Starting Tomorrow Morning',
    type: 'sms',
    body: 'Hi {customer_name}, our roofing crew is scheduled to arrive tomorrow at 7:00 AM at {address} to begin your roof project. Please keep pets indoors and make sure gates are unlocked. Our crew lead {rep_name} will check in upon arrival.',
    description: 'Night-before reminder for crew arrival.',
  },
  {
    id: 'review_request',
    name: 'Final Inspection Passed & Review Request',
    type: 'both',
    subject: 'Congratulations on Your New Roof! — Rise Up Roofing',
    body: 'Hi {customer_name}, congratulations on your new roof! The city building inspector has signed off on the final inspection. If you enjoyed working with our crew, would you take 30 seconds to share your experience on Google? {review_link}. Thank you for choosing Rise Up Roofing & Construction!',
    description: 'Automated 5-star review driver sent after job completion.',
  },
];

export function renderTemplate(
  templateBody: string,
  variables: Record<string, string | undefined | null>
): string {
  let rendered = templateBody;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  return rendered;
}
