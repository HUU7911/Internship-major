import { Routes, Route } from 'react-router-dom';
import Home from './page/Home';
import Login from './page/Login';
import Profile from './page/Profile';

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/login" element={<Login />} />
			<Route path="/profile" element={<Profile />} />
		</Routes>
	)
}