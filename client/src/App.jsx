import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BoardsList from './pages/BoardsList.jsx';
import BoardView from './pages/BoardView.jsx';
import Navbar from './components/Navbar.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-8 text-muted">Loading…</div>;
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-full text-ink">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <BoardsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/boards/:id"
          element={
            <PrivateRoute>
              <BoardView />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
