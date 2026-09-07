const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const replaceProps = `
interface MainDashboardProps {
  botState: BotState;
  onLogout: () => void;
  onAction?: any;
  currentUser?: string;
  onOpenInstallModal?: () => void;
  isStandalone?: boolean;
}

export function MainDashboard({ botState: state, onLogout, onAction, currentUser, onOpenInstallModal, isStandalone }: MainDashboardProps) {
  const onRefresh = () => {};
`;

code = code.replace(/interface MainDashboardProps \{[\s\S]*?const \[showConnectModal/m, replaceProps.trim() + '\n  const [showConnectModal');
fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('Props updated');
