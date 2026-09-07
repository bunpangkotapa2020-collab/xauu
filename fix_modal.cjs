const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(
`      {showConnectModal && (
        <ConnectMT5Modal 
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => {
            setShowConnectModal(false);
          }}
        />
      )}`,
`      <ConnectMT5Modal 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onVerified={() => {
          setShowConnectModal(false);
          if (onAction) onAction('refresh_state');
        }}
        currentLoginId={state.account.loginId}
        currentServer={state.account.server}
        currentAccountType={state.account.accountType}
      />`
);

fs.writeFileSync('src/components/MainDashboard.tsx', code);
