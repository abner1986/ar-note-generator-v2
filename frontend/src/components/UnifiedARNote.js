import React, { useState } from 'react';

function UnifiedARNote({ denialData }) {
  const [dos, setDos] = useState('');
  const [payer, setPayer] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [repName, setRepName] = useState('');
  const [action, setAction] = useState('corrected');
  const [actionDetails, setActionDetails] = useState('');
  const [followUp, setFollowUp] = useState('30');
  const [notes, setNotes] = useState('');

  const generateNote = () => {
    let note = `DOS ${dos} : As per review, claim submitted to ${payer} processed and denied as ${denialData?.description || '[DENIAL]'}. `;
    if (denialData?.is_callable) note += `Called and spoke with ${repName}. `;
    note += `${action === 'corrected' ? `Corrected claim with ${actionDetails} and resubmitted.` : ''} `;
    note += `Therefore, need to follow up in ${followUp} days. Claim# ${claimNumber}`;
    if (notes) note += ` Notes: ${notes}`;
    return note;
  };

  return (
    <div>
      <input placeholder="DOS" value={dos} onChange={e => setDos(e.target.value)} />
      <input placeholder="Payer" value={payer} onChange={e => setPayer(e.target.value)} />
      <input placeholder="Claim #" value={claimNumber} onChange={e => setClaimNumber(e.target.value)} />
      {denialData?.is_callable && <input placeholder="Rep Name" value={repName} onChange={e => setRepName(e.target.value)} />}
      <select value={action} onChange={e => setAction(e.target.value)}>
        <option value="corrected">Corrected Claim</option>
        <option value="appeal">Appeal</option>
        <option value="write-off">Write Off</option>
        <option value="bill-patient">Bill Patient</option>
      </select>
      <input placeholder="Action details" value={actionDetails} onChange={e => setActionDetails(e.target.value)} />
      <select value={followUp} onChange={e => setFollowUp(e.target.value)}>
        <option value="0">Monitor Only</option><option value="15">15 Days</option>
        <option value="30">30 Days</option><option value="45">45 Days</option><option value="60">60 Days</option>
      </select>
      <textarea placeholder="Additional notes" value={notes} onChange={e => setNotes(e.target.value)} />
      <div><strong>Generated Note:</strong><br/>{generateNote()}</div>
      <button onClick={() => navigator.clipboard.writeText(generateNote())}>Copy Note</button>
    </div>
  );
}

export default UnifiedARNote;