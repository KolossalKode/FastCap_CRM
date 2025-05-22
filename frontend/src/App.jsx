import React, { useState } from 'react';
import { login as apiLogin, fetchContacts } from './api.js';

function App() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const data = await apiLogin(email, password);
      setToken(data.access_token);
      const contactsData = await fetchContacts(data.access_token);
      setContacts(contactsData);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  if (!token) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>CRM Login</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Contacts</h1>
      <ul>
        {contacts.map(c => (
          <li key={c.id}>{c.firstName} {c.lastName} - {c.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
