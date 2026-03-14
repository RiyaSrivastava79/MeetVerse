const localServer = 'http://localhost:8000';
const remoteServer = 'https://apnacollegebackend.onrender.com';

const isLocalHost = typeof window !== 'undefined' && [
    'localhost',
    '127.0.0.1'
].includes(window.location.hostname);

const preferredServer = isLocalHost ? localServer : remoteServer;
const fallbackServer = isLocalHost ? remoteServer : localServer;

export const getServerCandidates = () => [preferredServer, fallbackServer];

export default preferredServer;