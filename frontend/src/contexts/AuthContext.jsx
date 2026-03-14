import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { getServerCandidates } from "../environment";


export const AuthContext = createContext({});

const apiClients = getServerCandidates().map((baseUrl) => axios.create({
    baseURL: `${baseUrl}/api/v1/users`,
    timeout: 8000
}));

const requestWithFallback = async (requestFactory) => {
    let lastError = null;

    for (const client of apiClients) {
        try {
            return await requestFactory(client);
        } catch (error) {
            lastError = error;

            if (error?.response) {
                throw error;
            }
        }
    }

    throw lastError;
};

const normalizeUsername = (username) => username.trim().toLowerCase();


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(authContext);

    const handleRegister = async (name, username, password) => {
        try {
            let request = await requestWithFallback((client) => client.post("/register", {
                name: name,
                username: normalizeUsername(username),
                password: password
            }));


            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await requestWithFallback((client) => client.post("/login", {
                username: normalizeUsername(username),
                password: password
            }));

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                return request.data;
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await requestWithFallback((client) => client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            }));
            return request.data
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await requestWithFallback((client) => client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            }));
            return request
        } catch (e) {
            throw e;
        }
    }


    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}