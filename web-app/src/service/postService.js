import httpClient from '../configuration/httpClient';

export const getBanner = () => {
    return httpClient.get(import.meta.env.VITE_BANNER);
};
