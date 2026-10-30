import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logIn, isAuthenticated } from '../service/authenticationService';

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap');

.fl-root {
	--chili: #d62828;
	--chili-dark: #a81d1d;
	--saffron: #fcbf49;
	--leaf: #2d6a4f;
	--ink: #2b1b17;
	--muted: #7a6a65;
	--line: #eadfd9;
	min-height: 100vh;
	display: grid;
	grid-template-columns: 1.1fr 1fr;
	font-family: 'Be Vietnam Pro', system-ui, sans-serif;
	color: var(--ink);
	background: #fff;
}

/* ---------- Left: brand panel ---------- */
.fl-hero {
	position: relative;
	overflow: hidden;
	background: var(--chili);
	color: #fff;
	padding: 56px 56px 48px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}
.fl-brand {
	font-family: 'Baloo 2', sans-serif;
	font-weight: 800;
	font-size: 26px;
	display: flex;
	align-items: center;
	gap: 10px;
}
.fl-brand-badge {
	width: 40px; height: 40px;
	border-radius: 50%;
	background: var(--saffron);
	display: grid; place-items: center;
	font-size: 22px;
}
.fl-headline {
	font-family: 'Baloo 2', sans-serif;
	font-weight: 800;
	font-size: clamp(40px, 5vw, 68px);
	line-height: 1.02;
	margin: 0 0 18px;
	max-width: 11ch;
}
.fl-sub {
	font-size: 17px;
	line-height: 1.6;
	max-width: 38ch;
	margin: 0;
	color: #ffe3dc;
}

/* big plate of dishes */
.fl-plate {
	position: absolute;
	right: -120px;
	bottom: -120px;
	width: 440px; height: 440px;
	border-radius: 50%;
	background: #fff6e5;
	box-shadow: 0 0 0 18px var(--chili-dark), 0 0 0 19px rgba(255,255,255,.25);
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	place-items: center;
	padding: 70px 150px 150px 70px;
	font-size: 72px;
}
.fl-plate span { display: block; line-height: 1; }

.fl-chips { display: flex; gap: 10px; flex-wrap: wrap; position: relative; z-index: 1; }
.fl-chip {
	background: rgba(255,255,255,.14);
	border: 1px solid rgba(255,255,255,.35);
	border-radius: 999px;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 500;
}

/* ---------- Right: form ---------- */
.fl-panel {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px 24px;
	background: #fffdfb;
}
.fl-card { width: 100%; max-width: 400px; }
.fl-title {
	font-family: 'Baloo 2', sans-serif;
	font-weight: 800;
	font-size: 36px;
	margin: 0 0 6px;
}
.fl-lead { margin: 0 0 28px; color: var(--muted); }

.fl-field { margin-bottom: 18px; }
.fl-label { display: block; font-weight: 600; font-size: 14px; margin-bottom: 8px; }
.fl-input-wrap { position: relative; }
.fl-input {
	width: 100%;
	box-sizing: border-box;
	padding: 14px 16px;
	font: inherit;
	color: var(--ink);
	background: #fff;
	border: 1.5px solid var(--line);
	border-radius: 14px;
	transition: border-color .15s, box-shadow .15s;
}
.fl-input::placeholder { color: #b9aaa4; }
.fl-input:focus {
	outline: none;
	border-color: var(--chili);
	box-shadow: 0 0 0 4px rgba(214, 40, 40, .14);
}
.fl-toggle {
	position: absolute;
	right: 8px; top: 50%;
	transform: translateY(-50%);
	background: none;
	border: 0;
	padding: 8px 10px;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: var(--leaf);
	cursor: pointer;
	border-radius: 8px;
}
.fl-toggle:focus-visible { outline: 3px solid var(--saffron); }

.fl-error {
	background: #fdecea;
	border: 1px solid #f5b8b2;
	color: var(--chili-dark);
	border-radius: 12px;
	padding: 12px 14px;
	font-size: 14px;
	margin-bottom: 18px;
}

.fl-submit {
	width: 100%;
	padding: 15px 20px;
	font: inherit;
	font-weight: 600;
	font-size: 16px;
	color: #fff;
	background: var(--chili);
	border: 0;
	border-radius: 14px;
	cursor: pointer;
	box-shadow: 0 6px 0 var(--chili-dark);
	transition: transform .1s, box-shadow .1s, background .15s;
}
.fl-submit:hover:not(:disabled) { background: #e03232; }
.fl-submit:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 2px 0 var(--chili-dark); }
.fl-submit:focus-visible { outline: 3px solid var(--saffron); outline-offset: 3px; }
.fl-submit:disabled { opacity: .7; cursor: wait; }

.fl-foot { margin: 26px 0 0; text-align: center; font-size: 14px; color: var(--muted); }
.fl-foot a { color: var(--leaf); font-weight: 600; text-decoration: none; }
.fl-foot a:hover { text-decoration: underline; }

/* ---------- Mobile ---------- */
@media (max-width: 820px) {
	.fl-root { grid-template-columns: 1fr; }
	.fl-hero { padding: 28px 24px 32px; gap: 20px; }
	.fl-headline { font-size: 36px; max-width: none; margin-bottom: 8px; }
	.fl-sub, .fl-plate, .fl-chips { display: none; }
	.fl-panel { align-items: flex-start; padding-top: 32px; }
}
`;

export default function Login() {
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isAuthenticated()) {
			navigate('/');
		}
	}, [navigate]);

	const handleLogin = async (event) => {
		event.preventDefault();
		setError('');
		setLoading(true);
		try {
			const response = await logIn(username, password);
			console.log('Login successful:', response);
			navigate('/');
		} catch (err) {
			const message =
				err?.response?.data?.message || 'Đăng nhập không thành công. Vui lòng thử lại.';
			console.error('Login failed:', message);
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<style>{styles}</style>
			<div className="fl-root">
				<aside className="fl-hero">
					<div className="fl-brand">
						<span className="fl-brand-badge" aria-hidden="true">🍜</span>
						Bếp Nhà
					</div>

					<div>
						<h2 className="fl-headline">Đói chưa? Mình lên món thôi.</h2>
						<p className="fl-sub">
							Đăng nhập để đặt món yêu thích, theo dõi đơn hàng và nhận ưu đãi dành riêng cho bạn.
						</p>
					</div>

					<div className="fl-chips">
						<span className="fl-chip">Giao trong 30 phút</span>
						<span className="fl-chip">Nguyên liệu tươi mỗi ngày</span>
					</div>

					<div className="fl-plate" aria-hidden="true">
						<span>🍕</span>
						<span>🍔</span>
						<span>🥗</span>
						<span>🍣</span>
					</div>
				</aside>

				<main className="fl-panel">
					<div className="fl-card">
						<h1 className="fl-title">Chào mừng trở lại</h1>
						<p className="fl-lead">Đăng nhập để tiếp tục đặt món.</p>

						<form onSubmit={handleLogin} noValidate={false}>
							{error && (
								<div className="fl-error" role="alert">
									{error}
								</div>
							)}

							<div className="fl-field">
								<label className="fl-label" htmlFor="username">Tên đăng nhập</label>
								<input
									className="fl-input"
									type="text"
									id="username"
									name="username"
									placeholder="Nhập tên đăng nhập"
									autoComplete="username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
								/>
							</div>

							<div className="fl-field">
								<label className="fl-label" htmlFor="password">Mật khẩu</label>
								<div className="fl-input-wrap">
									<input
										className="fl-input"
										type={showPassword ? 'text' : 'password'}
										id="password"
										name="password"
										placeholder="Nhập mật khẩu"
										autoComplete="current-password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										style={{ paddingRight: 72 }}
										required
									/>
									<button
										type="button"
										className="fl-toggle"
										onClick={() => setShowPassword((v) => !v)}
										aria-pressed={showPassword}
									>
										{showPassword ? 'Ẩn' : 'Hiện'}
									</button>
								</div>
							</div>

							<button className="fl-submit" type="submit" disabled={loading}>
								{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
							</button>
						</form>

						<p className="fl-foot">
							Chưa có tài khoản? <a href="/register">Đăng ký</a>
						</p>
					</div>
				</main>
			</div>
		</>
	);
}