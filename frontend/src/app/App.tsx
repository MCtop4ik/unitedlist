import { Route, Routes } from 'react-router-dom';
import { AppFooter, AppHeader } from '../components/layout/AppChrome';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { ProfilePage } from '../features/profile/ProfilePage';

export function App() {
  return (
    <div className="page">
      <AppHeader />
      <div className="main">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<CatalogPage />} />
        </Routes>
      </div>
      <AppFooter />
    </div>
  );
}
