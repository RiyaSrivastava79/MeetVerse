import * as React from 'react';
import { Snackbar } from '@mui/material';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/authPage.module.css';

const strongPasswordPattern = /^(?=.*[^A-Za-z0-9]).{8,}$/;
const normalizeUsername = (value) => value.trim().toLowerCase();

export default function Authentication() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [darkMode, setDarkMode] = React.useState(() => localStorage.getItem('av_theme') !== 'light');

    const toggleTheme = () => {
        setDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem('av_theme', next ? 'dark' : 'light');
            return next;
        });
    };

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { handleRegister, handleLogin } = React.useContext(AuthContext);
    const showPasswordHint = formState === 1 && password.length > 0 && !strongPasswordPattern.test(password);

    React.useEffect(() => {
        const mode = searchParams.get('mode');
        setFormState(mode === 'register' ? 1 : 0);
    }, [searchParams]);

    const handleAuth = async () => {
        try {
            const redirectPath = searchParams.get('redirect');
            setError('');
            setIsSubmitting(true);

            if (!username.trim() || !password.trim() || (formState === 1 && !name.trim())) {
                setError('Please fill all required fields.');
                return;
            }

            if (formState === 1 && !strongPasswordPattern.test(password)) {
                setError('Password must be at least 8 characters long and include a special character.');
                return;
            }

            if (formState === 0) {
                await handleLogin(normalizeUsername(username), password);
                navigate(redirectPath || '/home');
                return;
            }

            const normalizedUsername = normalizeUsername(username);
            const result = await handleRegister(name.trim(), normalizedUsername, password);

            await handleLogin(normalizedUsername, password);

            setUsername('');
            setPassword('');
            setName('');
            setMessage(`${result}. Account ready. Redirecting to your dashboard...`);
            setOpen(true);
            navigate(redirectPath || '/home');
        } catch (err) {
            console.log(err);
            setError(
                err?.response?.data?.message ||
                'Unable to reach the server. Please start the backend or try again in a moment.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`${styles.authShell}${darkMode ? '' : ' ' + styles.authLight}`}>
            <button type='button' className={styles.authThemeToggle} onClick={toggleTheme}>
                {darkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </button>
            <div className={styles.authBackdrop}></div>

            <div className={styles.authLayout}>
                <section className={styles.authHero}>
                    <div className={styles.brandPill}>Apna Video Call</div>
                    <h1>{formState === 0 ? 'Sign in and create your own meeting room' : 'Create your account and start hosting meetings'}</h1>
                    <p>
                        Sign up or log in first. Then generate a meeting, share the join link,
                        and invite participants directly to the room. If you do not want to create an account,
                        the guest flow is also available.
                    </p>

                    <div className={styles.heroStats}>
                        <div>
                            <strong>Instant rooms</strong>
                            <span>1 click meeting code</span>
                        </div>
                        <div>
                            <strong>Share fast</strong>
                            <span>Copy or send join link</span>
                        </div>
                        <div>
                            <strong>Guest access</strong>
                            <span>Without account join flow</span>
                        </div>
                    </div>
                </section>

                <section className={styles.authPanel}>
                    <div className={styles.authTabs}>
                        <button
                            type='button'
                            className={formState === 0 ? styles.activeTab : styles.tabButton}
                            onClick={() => { setFormState(0); setUsername(''); setPassword(''); setName(''); setError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            type='button'
                            className={formState === 1 ? styles.activeTab : styles.tabButton}
                            onClick={() => { setFormState(1); setUsername(''); setPassword(''); setName(''); setError(''); }}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className={styles.formCard}>
                        <h2>{formState === 0 ? 'Welcome back' : 'Create your account'}</h2>
                        <p>{formState === 0 ? 'Sign in to continue to your meeting dashboard.' : 'Register to start hosting your own meetings.'}</p>

                        {showPasswordHint ? (
                            <p className={styles.passwordHint}>Use 8+ characters with at least one special character.</p>
                        ) : null}

                        {formState === 1 ? (
                            <label className={styles.fieldGroup}>
                                <span>Full name</span>
                                <input
                                    type='text'
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder='Enter your full name'
                                    autoComplete='new-password'
                                    readOnly
                                    onFocus={(e) => e.target.removeAttribute('readOnly')}
                                />
                            </label>
                        ) : null}

                        <label className={styles.fieldGroup}>
                            <span>Username</span>
                            <input
                                type='text'
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                onBlur={() => setUsername((current) => normalizeUsername(current))}
                                placeholder='Enter username'
                                autoComplete='new-password'
                                autoCapitalize='none'
                                spellCheck='false'
                                readOnly
                                onFocus={(e) => e.target.removeAttribute('readOnly')}
                            />
                        </label>

                        <label className={styles.fieldGroup}>
                            <span>Password</span>
                            <input
                                type='password'
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder='Enter password'
                                autoComplete='new-password'
                                readOnly
                                onFocus={(e) => e.target.removeAttribute('readOnly')}
                            />
                        </label>

                        {error ? <p className={styles.errorText}>{error}</p> : null}

                        <button
                            type='button'
                            className={styles.primaryButton}
                            onClick={handleAuth}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Please wait...' : formState === 0 ? 'Login' : 'Create account'}
                        </button>

                        <div className={styles.secondaryActions}>
                            <button type='button' className={styles.ghostButton} onClick={() => navigate('/')}>
                                Join as Guest
                            </button>
                            <button type='button' className={styles.linkButton} onClick={() => navigate('/')}>
                                Back to landing
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                message={message}
            />
        </div>
    );
}