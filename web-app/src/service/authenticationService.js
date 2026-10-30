import { getToken, setToken, removeToken } from './sessionStorage';
import httpClient from '../configuration/httpClient';

export const logIn = async (username, password) => {
	try {
		const response = await httpClient.post(
			import.meta.env.VITE_TOKEN_KEY,
			{ username, password }
		);

		const token = response.data?.results?.token;

		if (!token) {
			throw new Error('Không nhận được token từ server.');
		}

		setToken(token);
		window.dispatchEvent(new Event('auth-changed'));

		return token;
	} catch (error) {
		console.error('Login failed:', {
			message: error.message,
			status: error.response?.status,
			response: error.response?.data,
		});

		throw error;
	}
};

export const logOut = () => {
	removeToken();
	window.dispatchEvent(new Event('auth-changed'));
};

export const isAuthenticated = () => {
	return !!getToken();
};
