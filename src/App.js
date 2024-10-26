import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Feed from './components/Feed';
import Events from './components/Events';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import PasswordReset from './components/PasswordReset';
import ChatList from './components/ChatList';
import ChatConversation from './components/ChatConversation';
import GroupChat from './components/GroupChat';
import SendAGMoney from './components/SendAGMoney';
import Wallet from './components/Wallet';
import GifBorder from './components/GifBorder';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import ExploreIcon from '@mui/icons-material/Explore';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import './App.css';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import WelcomeOverlay from './components/WelcomeOverlay';
import Explore from './components/Explore';
import Search from './components/Search';
import BrandDetails from './components/BrandDetails';
import AGBankDashboard from './components/AGBankDashboard'; 
import AdminPanel from './components/AdminPanel';
import BrandManagement from './components/BrandManagement';
import Shop from './components/Shop';
import Services from './components/Services';
import Consult from './components/Consult';
import Blog from './components/Blog';
import Courses from './components/Courses';
import BrandTemplate from './components/BrandTemplate';

const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#000000',
            paper: '#000000',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#FFFFFF',
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    color: '#FFFFFF',
                },
            },
        },
        MuiBottomNavigation: {
            styleOverrides: {
                root: {
                    backgroundColor: '#000000',
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    color: '#FFFFFF',
                },
            },
        },
    },
});

const gifs = [
    '/path-to-gif1.gif',
    '/path-to-gif2.gif',
    '/path-to-gif3.gif'
];

function App() {
    const [value, setValue] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const location = useLocation();

    const handleLogoClick = () => {
        if (location.pathname === '/feed') {
            window.location.reload();
        } else {
            navigate('/feed');
        }
    };

    const handleTabChange = (event, newValue) => {
        setValue(newValue);
        switch (newValue) {
            case 0:
                navigate('/feed');
                break;
            case 1:
                navigate('/events');
                break;
            case 2:
                navigate(`/profile`); // Navigate to logged-in user's profile
                break;
            case 3:
                navigate('/chat-list');
                break;
            case 4:
                navigate('/wallet');
                break;
            default:
                navigate('/feed');
                break;
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="App">
                {!user && <WelcomeOverlay />}

                <div className="top-bar">
                    <div className="search-container">
                        <IconButton onClick={() => setSearchOpen(!searchOpen)} className="search-icon" style={{ opacity: 1 }}>
                            <SearchIcon />
                        </IconButton>
                        {searchOpen && <Search />}
                    </div>

                    <div className="logo-container">
                        <img
                            src={'./logo192.png'}
                            alt="BlackApp"
                            className="logo"
                            onClick={handleLogoClick}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>

                    <div className="toolbar-actions">
                        <IconButton className="explore-icon" onClick={() => navigate('/explore')} style={{ opacity: 1 }}>
                            <ExploreIcon />
                        </IconButton>
                    </div>
                </div>

                <GifBorder gifs={gifs} />
                <div className="content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Feed />} />
                        <Route path="/feed" element={<Feed />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/password-reset" element={<PasswordReset />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/wallet/sendMoney/:recipientId" component={Wallet} />

                        {/* Protected Routes */}
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/profile/:uid" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/chat-list" element={<PrivateRoute><ChatList /></PrivateRoute>} />
                        <Route path="/chat/:userId" element={<PrivateRoute><ChatConversation /></PrivateRoute>} />
                        <Route path="/group-chat" element={<PrivateRoute><GroupChat /></PrivateRoute>} />
                        <Route path="/send-money" element={<PrivateRoute><SendAGMoney /></PrivateRoute>} />
                        <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
                        <Route path="/admin-dashboard" element={<PrivateRoute adminOnly={true}><AGBankDashboard /></PrivateRoute>} />
                        <Route path="/agbank-dashboard" element={<AGBankDashboard />} />
                        <Route path="/brand-management/:brandId" element={<BrandManagement />} />
                        <Route path="/brand-management/:brandId/shop" element={<Shop />} /> {/* Shop Management */}
                        <Route path="/brand-management/:brandId/services" element={<Services />} /> {/* Service Management */}
                        <Route path="/brand-management/:brandId/consult" element={<Consult />} />
                        <Route path="/brand-management/:brandId/blog" element={<Blog />} />
                        <Route path="/brand-management/:brandId/courses" element={<Courses />} />

                        {/* Brand Template */}
                        <Route path="/brand/:brandId" element={<BrandTemplate />} />

                        {/* Catch-All Route for Invalid URLs */}
                        <Route path="*" element={<Navigate to="/feed" />} />
                    </Routes>
                </div>
                {user && (
                    <BottomNavigation value={value} onChange={handleTabChange} className="bottom-nav">
                        <BottomNavigationAction label="Feed" icon={<HomeIcon />} />
                        <BottomNavigationAction label="Events" icon={<EventIcon />} />
                        <BottomNavigationAction label="Profile" icon={<AccountCircleIcon />} />
                        <BottomNavigationAction label="Chat" icon={<ChatIcon />} />
                        <BottomNavigationAction label="Wallet" icon={<FolderIcon />} />
                    </BottomNavigation>
                )}
            </div>
        </ThemeProvider>
    );
}

function AppWrapper() {
    return (
        <Router>
            <AuthProvider>
                <App />
            </AuthProvider>
        </Router>
    );
}

export default AppWrapper;
