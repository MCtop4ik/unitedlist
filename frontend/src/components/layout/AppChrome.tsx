import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import { DropdownMenu } from '../ui';

export function AppHeader() {
  const { session, signOut } = useAuth();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo-mark" aria-label="GD United List home">GD</Link>
        <div className="wordmark-wrap">
          <div className="wordmark">GD UNITED LIST<small>UNIFIED DEMONLIST / BETA</small></div>
        </div>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>Catalog</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        {session ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="account-chip" title={session.player.displayName} aria-label={`Account menu / PLAYER / ${session.player.displayName}`}>
              PLAYER / {session.player.displayName}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="menu" align="end">
                <DropdownMenu.Item className="subtab menu-item" asChild><Link to="/profile">PROFILE</Link></DropdownMenu.Item>
                <DropdownMenu.Item className="subtab menu-item" onSelect={signOut}>SIGN OUT</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <Link to="/profile" className="account-chip">SIGN IN / PROFILE</Link>
        )}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="mobile-nav" aria-label="Open navigation">MENU ≡</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="menu" align="end">
              <DropdownMenu.Item className="subtab menu-item" asChild><Link to="/">CATALOG</Link></DropdownMenu.Item>
              <DropdownMenu.Item className="subtab menu-item" asChild><Link to="/leaderboard">LEADERBOARD</Link></DropdownMenu.Item>
              <DropdownMenu.Item className="subtab menu-item" asChild><Link to="/profile">PROFILE</Link></DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>DATA: POINTERCRATE / AREDL / GDDL</span>
        <span>IMPORTED RECORDS ARE READ-ONLY / ACCOUNT BOARD ONLY</span>
      </div>
    </footer>
  );
}
