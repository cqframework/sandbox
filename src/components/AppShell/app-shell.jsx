import * as React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import PersonIcon from '@mui/icons-material/Person';
import MedicationIcon from '@mui/icons-material/Medication';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ScienceIcon from '@mui/icons-material/Science';
import StyleIcon from '@mui/icons-material/Style';

import cdsHooksLogo from '../../assets/cds-hooks-logo.png'

const NAV = [
    { segment: 'patient-view', title: 'Patient View', icon: <PersonIcon /> },
    { segment: 'rx-view',      title: 'Order Select', icon: <MedicationIcon /> },
    { segment: 'rx-sign',      title: 'Order Sign',   icon: <AssignmentTurnedInIcon /> },
    { segment: 'pama',         title: 'PAMA',         icon: <ScienceIcon /> },
    { segment: 'card-demo',    title: 'Card Demo',    icon: <StyleIcon /> },
];

export default function AppShell({ activeSegment, onNavigate, children }) {
  // Initialize from the current path (e.g., "/rx-view") first, falling back to parent prop
  const initialSeg = (typeof window !== 'undefined' && window.location.pathname.replace(/^\//, '')) || activeSegment || 'patient-view';
  const [seg, setSeg] = React.useState(initialSeg);

  // Keep local state in sync if parent changes activeSegment
  React.useEffect(() => {
    if (activeSegment && activeSegment !== seg) {
      setSeg(activeSegment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSegment]);

  // Respond to back/forward navigation by updating local state
  React.useEffect(() => {
    const handler = () => {
      const next = (window.location.pathname || '/').replace(/^\//, '') || 'patient-view';
      setSeg(next);
      // Inform parent so Redux stays aligned
      const hook = next === 'rx-view' ? 'order-select' : next === 'rx-sign' ? 'order-sign' : next;
      onNavigate?.(next);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute a pathname for Toolpad from local state
  const pathname = `/${seg || ''}`;

  return (
    <AppProvider
      branding={{
        title: 'CDS Hooks Sandbox',
        logo: <img src={cdsHooksLogo} alt="CDS Hooks logo" />,
      }}
      navigation={NAV}
    >
      <DashboardLayout
        router={{
          pathname,
          searchParams: new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''),
          navigate: (path) => {
            const next = path.replace(/^\//, '') || 'patient-view';
            // Preserve existing query params and set canonical screen & hook
            if (typeof window !== 'undefined') {
              const params = new URLSearchParams(window.location.search);
              const hook = next === 'rx-view' ? 'order-select' : next === 'rx-sign' ? 'order-sign' : next;
              params.set('screen', next);
              params.set('hook', hook);
              window.history.pushState({}, '', `/${next}?${params.toString()}`);
            }
            // Update local state immediately so DashboardLayout highlights correctly
            setSeg(next);
            // Inform parent so Redux switches views
            onNavigate?.(next);
          },
        }}
      >
        {children}
      </DashboardLayout>
    </AppProvider>
  );
}
