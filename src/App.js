import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router} from 'react-router-dom';
import RouterConfig from './RouterConfig';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <RouterConfig />
      </Router>
    </UserProvider>
  );
}

export default App;
