import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router} from 'react-router-dom';
import RouterConfig from './RouterConfig';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/organisms/Header';
import Footer from './components/organisms/Footer';

function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <Router>
          <Header />
          <RouterConfig />
          <Footer />
        </Router>
      </ToastProvider>
    </UserProvider>
  );
}

export default App;
