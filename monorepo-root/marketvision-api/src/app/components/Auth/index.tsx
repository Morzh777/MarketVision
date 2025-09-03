import Client from './Client';

export default function Auth({ onLogin }: { onLogin: (username: string, password: string) => Promise<boolean> }) {
  return <Client onLogin={onLogin} />;
}
