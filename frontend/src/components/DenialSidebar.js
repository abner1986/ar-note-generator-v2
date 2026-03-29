import React, { useState, useEffect } from 'react';
import api from '../api';

function DenialSidebar({ onSelectCode }) {
  const [codes, setCodes] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/all-denial-codes').then(res => setCodes(res.data));
  }, []);

  const filtered = codes.filter(c => c.code.includes(search) || c.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ width: 300, borderRight: '1px solid #ccc', padding: 10 }}>
      <input type="text" placeholder="Search code..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {filtered.map(c => (
          <div key={c.code} onClick={() => onSelectCode(c)} style={{ padding: 5, cursor: 'pointer', borderBottom: '1px solid #eee' }}>
            <strong>{c.code}</strong> – {c.description.substring(0, 60)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DenialSidebar;