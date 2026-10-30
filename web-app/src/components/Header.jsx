import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import httpClient from '../configuration/httpClient';
import { getMyProfile } from '../service/userService';
import { getToken } from '../service/sessionStorage';
import { logOut } from '../service/authenticationService';

export const search = async (keyword) => {
	return httpClient.get(import.meta.env.VITE_SEARCH, {
		params: { keyword },
	});
};

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap');

.hd, .hd * { box-sizing: border-box; }

.hd {
	--chili: #d62828;
	--chili-dark: #a81d1d;
	--saffron: #fcbf49;
	--leaf: #2d6a4f;
	--ink: #2b1b17;
	--muted: #7a6a65;
	--line: #eadfd9;
	position: sticky;
	top: 0;
	z-index: 1000;
	display: grid;
	grid-template-columns: auto minmax(0, 1fr) auto;
	align-items: center;
	gap: 24px;
	width: 100%;
	padding: 10px clamp(16px, 4vw, 60px);
	background: #fff;
	border-bottom: 3px solid var(--chili);
	box-shadow: 0 6px 20px rgba(168, 29, 29, .08);
	font-family: 'Be Vietnam Pro', system-ui, sans-serif;
	color: var(--ink);
}

/* ---------- logo ---------- */
.hd-logo { grid-area: logo; display: flex; align-items: center; text-decoration: none; border-radius: 10px; }
.hd-logo:focus-visible { outline: 3px solid var(--saffron); outline-offset: 3px; }
.hd-logo img { display: block; width: 150px; max-width: 100%; height: 48px; object-fit: contain; }

/* ---------- search ---------- */
.hd-search { grid-area: search; position: relative; width: 100%; max-width: 620px; justify-self: center; }
.hd-search-form {
	display: flex; align-items: center;
	padding: 5px 5px 5px 16px;
	background: #fff8f3;
	border: 1.5px solid var(--line);
	border-radius: 999px;
	transition: border-color .15s, box-shadow .15s, background .15s;
}
.hd-search-form:focus-within {
	background: #fff;
	border-color: var(--chili);
	box-shadow: 0 0 0 4px rgba(214, 40, 40, .12);
}
.hd-search-icon { flex: none; font-size: 16px; opacity: .6; }
.hd-search-input {
	flex: 1; min-width: 0;
	padding: 10px 12px;
	font: inherit; font-size: 15px; color: var(--ink);
	background: transparent; border: 0; outline: none;
}
.hd-search-input::placeholder { color: #b0a09a; }
.hd-search-input::-webkit-search-cancel-button { display: none; }
.hd-clear {
	flex: none;
	width: 28px; height: 28px; margin-right: 4px;
	display: grid; place-items: center;
	font-size: 14px; color: var(--muted);
	background: transparent; border: 0; border-radius: 50%;
	cursor: pointer;
}
.hd-clear:hover { background: #f3e7e1; }
.hd-clear:focus-visible { outline: 3px solid var(--saffron); }
.hd-search-btn {
	flex: none;
	padding: 10px 22px;
	font: inherit; font-size: 14px; font-weight: 600;
	color: #fff; background: var(--chili);
	border: 0; border-radius: 999px;
	cursor: pointer;
	transition: background .15s;
}
.hd-search-btn:hover { background: #e03232; }
.hd-search-btn:focus-visible { outline: 3px solid var(--saffron); outline-offset: 2px; }

/* ---------- results ---------- */
.hd-results {
	position: absolute;
	top: calc(100% + 10px); left: 0; right: 0;
	max-height: 380px; overflow-y: auto;
	padding: 6px;
	background: #fff;
	border: 1px solid var(--line);
	border-radius: 18px;
	box-shadow: 0 16px 40px rgba(43, 27, 23, .14);
	z-index: 1001;
}
.hd-result {
	display: flex; align-items: center; justify-content: space-between; gap: 12px;
	width: 100%;
	padding: 11px 12px;
	font: inherit; font-size: 14px; text-align: left; color: var(--ink);
	background: transparent; border: 0; border-radius: 12px;
	cursor: pointer;
}
.hd-result:hover, .hd-result.active { background: #fff1e4; }
.hd-result-name { min-width: 0; overflow-wrap: anywhere; }
.hd-result-name mark { background: var(--saffron); color: var(--ink); border-radius: 3px; padding: 0 1px; }
.hd-result-price { flex: none; font-weight: 600; color: var(--chili); }
.hd-message { margin: 0; padding: 18px 14px; font-size: 14px; color: var(--muted); text-align: center; }
.hd-message.error { color: var(--chili-dark); }

/* ---------- account ---------- */
.hd-account { grid-area: account; position: relative; }
.hd-login {
	padding: 11px 24px;
	font: inherit; font-size: 14px; font-weight: 600;
	color: #fff; background: var(--chili);
	border: 0; border-radius: 999px;
	box-shadow: 0 4px 0 var(--chili-dark);
	cursor: pointer; white-space: nowrap;
	transition: transform .1s, box-shadow .1s, background .15s;
}
.hd-login:hover { background: #e03232; }
.hd-login:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--chili-dark); }
.hd-login:focus-visible { outline: 3px solid var(--saffron); outline-offset: 3px; }

.hd-avatar-btn {
	display: block;
	padding: 0;
	border: 0;
	border-radius: 50%;
	background: transparent;
	cursor: pointer;
	box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--line);
	transition: box-shadow .15s, transform .15s;
}
.hd-avatar-btn:hover { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--saffron); }
.hd-avatar-btn[aria-expanded="true"] { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--chili); }
.hd-avatar-btn:focus-visible { outline: 3px solid var(--saffron); outline-offset: 4px; }
.hd-avatar-btn .hd-avatar { width: 44px; height: 44px; font-size: 19px; }
.hd-avatar {
	width: 40px; height: 40px; flex: none;
	display: grid; place-items: center;
	border-radius: 50%;
	object-fit: cover;
	background: #fff0d6; color: var(--chili);
	font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 18px;
}
.hd-avatar.lg { width: 48px; height: 48px; font-size: 21px; }

.hd-dropdown {
	position: absolute;
	top: calc(100% + 12px); right: 0;
	width: 290px; max-width: calc(100vw - 32px);
	background: #fff;
	border: 1px solid var(--line);
	border-radius: 18px;
	box-shadow: 0 16px 40px rgba(43, 27, 23, .16);
	overflow: hidden;
	z-index: 1002;
	animation: hd-pop .14s ease-out;
}
@keyframes hd-pop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.hd-profile {
	display: flex; align-items: center; gap: 12px;
	padding: 16px;
	background: #fff3e6;
	border-bottom: 1px solid var(--line);
}
.hd-profile-name { margin: 0; font-weight: 600; font-size: 15px; overflow-wrap: anywhere; }
.hd-profile-email { margin: 3px 0 0; font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }
.hd-menu { padding: 8px; }
.hd-menu-item {
	display: flex; align-items: center; gap: 12px;
	width: 100%;
	padding: 12px;
	font: inherit; font-size: 14px; text-align: left; color: var(--ink);
	background: transparent; border: 0; border-radius: 12px;
	cursor: pointer;
}
.hd-menu-item:hover { background: #fff1e4; }
.hd-menu-item:focus-visible { outline: 3px solid var(--saffron); }
.hd-menu-item.danger { color: var(--chili-dark); }
.hd-menu-item.danger:hover { background: #fdecea; }
.hd-menu-sep { height: 1px; margin: 6px 4px; background: var(--line); }

/* ---------- responsive ---------- */
.hd { grid-template-areas: "logo search account"; }
@media (max-width: 720px) {
	.hd {
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas: "logo account" "search search";
		gap: 10px 12px;
	}
	.hd-logo img { width: 120px; height: 40px; }
	.hd-search { max-width: none; }
	.hd-search-btn { padding: 10px 16px; }
}
@media (max-width: 400px) {
	.hd-search-btn { display: none; }
	.hd-search-form { padding-right: 8px; }
}
@media (prefers-reduced-motion: reduce) {
	.hd-dropdown { animation: none; }
}
`;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function Highlight({ text, keyword }) {
	const value = keyword.trim();
	if (!value) return text;

	const parts = String(text).split(new RegExp(`(${escapeRegExp(value)})`, 'ig'));

	return parts.map((part, index) =>
		part.toLowerCase() === value.toLowerCase() ? (
			<mark key={index}>{part}</mark>
		) : (
			<span key={index}>{part}</span>
		)
	);
}

export default function Header() {
	const navigate = useNavigate();
	const menuRef = useRef(null);
	const searchRef = useRef(null);

	const [keyword, setKeyword] = useState('');
	const [results, setResults] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState('');
	const [showResults, setShowResults] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);

	const [token, setToken] = useState(() => getToken());
	const [profile, setProfile] = useState(null);
	const [showProfile, setShowProfile] = useState(false);
	const [avatarBroken, setAvatarBroken] = useState(false);

	const fetchProfile = useCallback(async () => {
		if (!getToken()) {
			setProfile(null);
			return;
		}

		try {
			const response = await getMyProfile();
			const data = response.data;
			setProfile(data?.results ?? data?.data ?? data);
			setAvatarBroken(false);
		} catch (error) {
			console.error('Lỗi lấy thông tin profile:', error);
		}
	}, []);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile, token]);

	useEffect(() => {
		const syncAuth = () => {
			const currentToken = getToken();

			setToken(currentToken);
			setShowProfile(false);

			if (!currentToken) {
				setProfile(null);
			}
		};

		window.addEventListener('auth-changed', syncAuth);

		return () => {
			window.removeEventListener('auth-changed', syncAuth);
		};
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowProfile(false);
			}

			if (searchRef.current && !searchRef.current.contains(event.target)) {
				setShowResults(false);
			}
		};

		const handleEscape = (event) => {
			if (event.key === 'Escape') {
				setShowProfile(false);
				setShowResults(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, []);

	useEffect(() => {
		const value = keyword.trim();

		if (!value) {
			setResults([]);
			setSearchError('');
			setSearchLoading(false);
			setActiveIndex(-1);
			return;
		}

		let cancelled = false;

		const timer = setTimeout(async () => {
			try {
				setSearchLoading(true);
				setSearchError('');

				const response = await search(value);
				const data = response.data;
				const list = Array.isArray(data)
					? data
					: data?.results ?? data?.data ?? [];

				if (!cancelled) {
					setResults(Array.isArray(list) ? list : []);
					setActiveIndex(-1);
					setShowResults(true);
				}
			} catch (error) {
				if (!cancelled) {
					console.error('Lỗi tìm kiếm:', error);
					setSearchError('Không thể tìm kiếm. Vui lòng thử lại.');
					setResults([]);
					setShowResults(true);
				}
			} finally {
				if (!cancelled) {
					setSearchLoading(false);
				}
			}
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [keyword]);

	const openResult = (item) => {
		setShowResults(false);
		navigate(`/product/${item.id ?? item._id}`);
	};

	const handleSearch = (event) => {
		event.preventDefault();

		if (!keyword.trim()) return;

		// Nếu đang chọn một kết quả bằng phím mũi tên thì mở luôn.
		if (activeIndex >= 0 && results[activeIndex]) {
			openResult(results[activeIndex]);
			return;
		}

		setShowResults(true);

		// API tìm kiếm đã được gọi tự động qua useEffect.
	};

	const handleSearchKeyDown = (event) => {
		if (!showResults || results.length === 0) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setActiveIndex((index) => (index + 1) % results.length);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
		}
	};

	const handleClear = () => {
		setKeyword('');
		setShowResults(false);
	};

	const handleLogin = () => {
		navigate('/login');
	};

	const handleLogout = () => {
		logOut();
		setShowProfile(false);
		navigate('/');
	};

	const goTo = (path) => {
		setShowProfile(false);
		navigate(path);
	};

	const displayName =
		[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
		profile?.username ||
		profile?.email ||
		'Tài khoản';

	const avatarUrl =
		profile?.avatar ?? profile?.avatarUrl ?? profile?.imageUrl;

	const initial = displayName.charAt(0).toUpperCase();
	const hasAvatar = Boolean(avatarUrl) && !avatarBroken;

	const renderAvatar = (large = false) =>
		hasAvatar ? (
			<img
				className={`hd-avatar${large ? ' lg' : ''}`}
				src={avatarUrl}
				alt=""
				onError={() => setAvatarBroken(true)}
			/>
		) : (
			<span className={`hd-avatar${large ? ' lg' : ''}`} aria-hidden="true">
				{initial}
			</span>
		);

	const resultsOpen = showResults && keyword.trim();

	return (
		<header className="hd">
			<style>{styles}</style>

			<a href="/" className="hd-logo" aria-label="Shop Meal - Trang chủ">
				<img src="/shop-meal-logo.png" alt="Shop Meal" />
			</a>

			<div ref={searchRef} className="hd-search">
				<form onSubmit={handleSearch} className="hd-search-form" role="search">
					<span className="hd-search-icon" aria-hidden="true">🔍</span>

					<input
						className="hd-search-input"
						type="search"
						placeholder="Hôm nay bạn muốn ăn gì?"
						value={keyword}
						onFocus={() => {
							if (keyword.trim()) setShowResults(true);
						}}
						onChange={(event) => setKeyword(event.target.value)}
						onKeyDown={handleSearchKeyDown}
						aria-label="Tìm kiếm món ăn"
						aria-expanded={Boolean(resultsOpen)}
						aria-controls="hd-results"
						autoComplete="off"
					/>

					{keyword && (
						<button
							type="button"
							className="hd-clear"
							onClick={handleClear}
							aria-label="Xóa từ khóa"
						>
							✕
						</button>
					)}

					<button type="submit" className="hd-search-btn">
						Tìm món
					</button>
				</form>

				{resultsOpen && (
					<div className="hd-results" id="hd-results" role="listbox">
						{searchLoading ? (
							<p className="hd-message">Đang tìm món...</p>
						) : searchError ? (
							<p className="hd-message error">{searchError}</p>
						) : results.length === 0 ? (
							<p className="hd-message">
								Chưa có món nào khớp với “{keyword.trim()}”. Thử từ khóa khác nhé.
							</p>
						) : (
							results.map((item, index) => (
								<button
									key={item.id ?? item._id ?? index}
									type="button"
									role="option"
									aria-selected={index === activeIndex}
									className={`hd-result${index === activeIndex ? ' active' : ''}`}
									onMouseEnter={() => setActiveIndex(index)}
									onClick={() => openResult(item)}
								>
									<span className="hd-result-name">
										<Highlight text={item.name ?? item.title ?? 'Món ăn'} keyword={keyword} />
									</span>

									{item.price != null && (
										<span className="hd-result-price">
											{Number(item.price).toLocaleString('vi-VN')}₫
										</span>
									)}
								</button>
							))
						)}
					</div>
				)}
			</div>

			<div ref={menuRef} className="hd-account">
				{!token ? (
					<button type="button" className="hd-login" onClick={handleLogin}>
						Đăng nhập
					</button>
				) : (
					<>
						<button
							type="button"
							className="hd-avatar-btn"
							onClick={() => setShowProfile((prev) => !prev)}
							aria-label="Mở menu tài khoản"
							aria-haspopup="menu"
							aria-expanded={showProfile}
						>
							{renderAvatar()}
						</button>

						{showProfile && (
							<div className="hd-dropdown" role="menu">
								<div className="hd-profile">
									{renderAvatar(true)}

									<div style={{ minWidth: 0 }}>
										<p className="hd-profile-name">{displayName}</p>
										{profile?.email && (
											<p className="hd-profile-email">{profile.email}</p>
										)}
									</div>
								</div>

								<div className="hd-menu">
									<button
										type="button"
										role="menuitem"
										className="hd-menu-item"
										onClick={() => goTo('/profile')}
									>
										<span aria-hidden="true">👤</span>
										Thông tin cá nhân
									</button>

									<button
										type="button"
										role="menuitem"
										className="hd-menu-item"
										onClick={() => goTo('/orders')}
									>
										<span aria-hidden="true">📦</span>
										Đơn hàng của tôi
									</button>

									<div className="hd-menu-sep" />

									<button
										type="button"
										role="menuitem"
										className="hd-menu-item danger"
										onClick={handleLogout}
									>
										<span aria-hidden="true">↪</span>
										Đăng xuất
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</header>
	);
}