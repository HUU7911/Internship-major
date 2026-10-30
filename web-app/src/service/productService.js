import httpClient from '../configuration/httpClient'
import {getToken} from './sessionStorage'

export const createProduct = async (productData) => {
    return httpClient.post(import.meta.env.VITE_PRODUCT_CREATE, productData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "multipart/form-data",
        },
    });
};

export const getAllProduct = async () => {
    return httpClient.get(import.meta.env.VITE_PRODUCT_GETALL, {
        headers: {
            "Content-Type" : "application/json",
        },
    });
};