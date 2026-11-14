import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { Spin } from 'antd';

export default function AuthRedirectPage() {
  const { instance, inProgress } = useMsal();
  const navigate = useNavigate();
  const hasLeftCallback = useRef(false);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None || hasLeftCallback.current) return;

    // MsalProvider already processes the OAuth callback. Processing it again here
    // can race with the provider and send the app back into a login redirect loop.
    const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
    if (account) instance.setActiveAccount(account);

    hasLeftCallback.current = true;
    navigate('/login', { replace: true });
  }, [inProgress, instance, navigate]);

  const busy = inProgress === InteractionStatus.HandleRedirect
    || inProgress === InteractionStatus.Startup;

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      {busy ? <Spin size="large" description="Signing in with Microsoft..." /> : null}
    </div>
  );
}
