const localServer = 'http://localhost:8000';
const remoteServer = 'https://meetverse-backend.onrender.com';

const isPrivateLanHost = (hostname) => {
    return /^10\./.test(hostname)
        || /^192\.168\./.test(hostname)
        || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
};

const isLocalHost = typeof window !== 'undefined' && (() => {
    const hostname = window.location.hostname;
    return hostname === 'localhost'
        || hostname === '127.0.0.1'
        || hostname === '::1'
        || isPrivateLanHost(hostname);
})();

const preferredServer = isLocalHost ? localServer : remoteServer;
const fallbackServer = isLocalHost ? remoteServer : localServer;

export const getServerCandidates = () => [preferredServer, fallbackServer];

export default preferredServer;