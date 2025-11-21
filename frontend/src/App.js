import React from 'react';
import DoctorView from './DoctorView';
import PatientPortal from './PatientPortal';
import AdminPage from './AdminPage';

function App() {
  const [tab, setTab] = React.useState('doctor');
  return (
    <div style={{ padding: 20 }}>
      <h1>UH-IAS Demo Portal</h1>
      <button onClick={() => setTab('doctor')}>Doctor View</button>
      <button onClick={() => setTab('patient')}>Patient Portal</button>
      <button onClick={() => setTab('admin')}>Admin Page</button>
      <hr />
      {tab === 'doctor' && <DoctorView />}
      {tab === 'patient' && <PatientPortal />}
      {tab === 'admin' && <AdminPage />}
    </div>
  );
}

export default App;
