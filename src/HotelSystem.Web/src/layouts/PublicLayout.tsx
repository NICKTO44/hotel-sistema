import { Outlet } from 'react-router-dom';

// PublicLayout es solo un wrapper — cada página pública maneja su propio layout
const PublicLayout = () => <Outlet />;

export default PublicLayout;