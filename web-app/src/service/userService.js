import httpClient from '../configuration/httpClient';
import { getToken } from './sessionStorage';

export const getMyProfile = async () => {
    return httpClient.get(import.meta.env.VITE_GET_MY_PROFILE, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
};

export const updateProfile = async (profileData) => {
    return httpClient.put(
        import.meta.env.VITE_UPDATE,
        profileData,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        }
    );
};

export const updateAvatar = async(formData) => {
	return httpClient.put(import.meta.env.VITE_UPDATE_AVATAR, formData, {
		headers: {
			Authorization: `Bearer ${getToken()}`,
			"Content-Type" : 'multipart/form-data',
		},
	});
};
