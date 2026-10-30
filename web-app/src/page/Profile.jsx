import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	getMyProfile,
	updateProfile,
	updateAvatar,
} from '../service/userService';
import { getToken } from '../service/sessionStorage';
import { logOut } from '../service/authenticationService';

const emptyForm = {
	firstName: '',
	lastName: '',
	email: '',
	username: '',
	phoneNumber: '',
	dob: '',
	address: '',
	avatar: '',
};

const unwrapResponse = (response) => {
	let data = response?.data;

	if (data?.results !== undefined) data = data.results;
	else if (data?.data !== undefined) data = data.data;
	else if (data?.result !== undefined) data = data.result;

	return data || {};
};

const normalizeProfile = (data = {}) => ({
	firstName: data.firstName ?? '',
	lastName: data.lastName ?? '',
	email: data.email ?? '',
	username: data.username ?? '',
	phoneNumber: data.phoneNumber ?? '',
	dob: data.dob ? String(data.dob).slice(0, 10) : '',
	address: data.address ?? '',
	avatar: data.avatar ?? data.avatarUrl ?? '',
});

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap');

.pf, .pf * { box-sizing: border-box; }

.pf {
	--chili: #d62828;
	--chili-dark: #a81d1d;
	--saffron: #fcbf49;
	--leaf: #2d6a4f;
	--ink: #2b1b17;
	--muted: #7a6a65;
	--line: #eadfd9;
	min-height: 100vh;
	padding: 24px 20px 56px;
	background: #fff8f3;
	color: var(--ink);
	font-family: 'Be Vietnam Pro', system-ui, sans-serif;
}
.pf-container { max-width: 1120px; margin: 0 auto; }

/* ---------- top bar ---------- */
.pf-topbar {
	display: flex; align-items: center; justify-content: space-between;
	margin-bottom: 24px;
}
.pf-back {
	display: inline-flex; align-items: center; gap: 8px;
	padding: 10px 16px;
	font: inherit; font-size: 14px; font-weight: 600;
	color: var(--ink);
	background: #fff;
	border: 1.5px solid var(--line);
	border-radius: 999px;
	cursor: pointer;
	transition: border-color .15s, color .15s;
}
.pf-back:hover { border-color: var(--chili); color: var(--chili); }
.pf-brand {
	display: flex; align-items: center; gap: 10px;
	font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 22px;
	color: var(--chili);
}
.pf-brand-badge {
	width: 34px; height: 34px; border-radius: 50%;
	display: grid; place-items: center;
	background: var(--saffron); font-size: 18px;
}

.pf-heading { margin: 0 0 22px; }
.pf-heading h1 {
	margin: 0 0 4px;
	font-family: 'Baloo 2', sans-serif; font-weight: 800;
	font-size: 34px; line-height: 1.1;
}
.pf-heading p { margin: 0; color: var(--muted); font-size: 15px; }

/* ---------- layout ---------- */
.pf-layout {
	display: grid;
	grid-template-columns: 300px minmax(0, 1fr);
	gap: 24px;
	align-items: start;
}
.pf-sidebar, .pf-content {
	min-width: 0;
	background: #fff;
	border: 1px solid var(--line);
	border-radius: 22px;
	overflow: hidden;
}

/* ---------- user card ---------- */
.pf-user { text-align: center; padding: 0 20px 22px; border-bottom: 1px solid var(--line); }
.pf-cover {
	height: 96px;
	margin: 0 -20px;
	background:
		radial-gradient(circle at 85% 20%, rgba(252,191,73,.55) 0 28px, transparent 29px),
		radial-gradient(circle at 12% 90%, rgba(255,255,255,.18) 0 40px, transparent 41px),
		var(--chili);
}

/* clickable avatar */
.pf-avatar-btn {
	position: relative;
	display: block;
	width: 112px; height: 112px;
	margin: -56px auto 14px;
	padding: 0;
	border: 4px solid #fff;
	border-radius: 50%;
	background: #fff0d6;
	color: var(--chili);
	font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 42px;
	cursor: pointer;
	box-shadow: 0 6px 18px rgba(168, 29, 29, .22);
}
.pf-avatar-btn:disabled { cursor: progress; }
.pf-avatar-btn:focus-visible { outline: 3px solid var(--saffron); outline-offset: 3px; }
.pf-avatar-img, .pf-avatar-fallback {
	width: 100%; height: 100%;
	border-radius: 50%;
	object-fit: cover;
	display: grid; place-items: center;
}
.pf-avatar-overlay {
	position: absolute; inset: 0;
	border-radius: 50%;
	display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
	background: rgba(43, 27, 23, .58);
	color: #fff;
	font-family: 'Be Vietnam Pro', sans-serif; font-size: 12px; font-weight: 600;
	opacity: 0;
	transition: opacity .15s;
}
.pf-avatar-overlay span:first-child { font-size: 22px; line-height: 1; }
.pf-avatar-btn:hover .pf-avatar-overlay,
.pf-avatar-btn:focus-visible .pf-avatar-overlay,
.pf-avatar-btn.is-uploading .pf-avatar-overlay { opacity: 1; }
.pf-avatar-badge {
	position: absolute; right: 2px; bottom: 4px;
	width: 32px; height: 32px;
	display: grid; place-items: center;
	border: 3px solid #fff; border-radius: 50%;
	background: var(--saffron);
	font-size: 14px;
}
.pf-spinner {
	width: 26px; height: 26px;
	border: 3px solid rgba(255,255,255,.4);
	border-top-color: #fff;
	border-radius: 50%;
	animation: pf-spin .8s linear infinite;
}
@keyframes pf-spin { to { transform: rotate(360deg); } }

.pf-hint { margin: 0 0 12px; color: var(--muted); font-size: 12px; }
.pf-user h2 { margin: 0 0 4px; font-family: 'Baloo 2', sans-serif; font-size: 22px; overflow-wrap: anywhere; }
.pf-user .pf-email { margin: 0; color: var(--muted); font-size: 13px; overflow-wrap: anywhere; }

/* ---------- menu ---------- */
.pf-menu { display: flex; flex-direction: column; gap: 4px; padding: 12px; }
.pf-menu button {
	display: flex; align-items: center; gap: 12px;
	width: 100%; padding: 12px 14px;
	font: inherit; font-size: 14px; font-weight: 500; text-align: left;
	color: var(--ink);
	background: transparent; border: 0; border-radius: 12px;
	cursor: pointer;
	transition: background .15s;
}
.pf-menu button:hover { background: #fff3e6; }
.pf-menu button.active { background: #fde8e6; color: var(--chili-dark); font-weight: 600; }
.pf-menu button:focus-visible { outline: 3px solid var(--saffron); }
.pf-menu .pf-logout { margin-top: 6px; color: var(--chili-dark); }

/* ---------- content ---------- */
.pf-content { padding: 28px; }
.pf-content-header {
	display: flex; align-items: center; justify-content: space-between; gap: 16px;
	margin-bottom: 24px; padding-bottom: 20px;
	border-bottom: 1px solid var(--line);
}
.pf-content-header h2 { margin: 0 0 4px; font-family: 'Baloo 2', sans-serif; font-size: 24px; }
.pf-content-header p { margin: 0; color: var(--muted); font-size: 14px; }

.pf-btn {
	display: inline-flex; align-items: center; justify-content: center; gap: 8px;
	min-height: 44px; padding: 10px 20px;
	font: inherit; font-size: 14px; font-weight: 600;
	color: var(--ink);
	background: #fff;
	border: 1.5px solid var(--line);
	border-radius: 12px;
	cursor: pointer;
	transition: border-color .15s, background .15s;
}
.pf-btn:hover:not(:disabled) { border-color: var(--ink); }
.pf-btn.primary {
	color: #fff; background: var(--chili); border-color: var(--chili);
	box-shadow: 0 4px 0 var(--chili-dark);
}
.pf-btn.primary:hover:not(:disabled) { background: #e03232; border-color: #e03232; }
.pf-btn.primary:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 var(--chili-dark); }
.pf-btn:focus-visible { outline: 3px solid var(--saffron); outline-offset: 2px; }
.pf-btn:disabled { opacity: .6; cursor: not-allowed; }

.pf-alert {
	margin-bottom: 18px; padding: 12px 14px;
	border-radius: 12px; font-size: 14px; line-height: 1.5; overflow-wrap: anywhere;
}
.pf-alert.error { background: #fdecea; border: 1px solid #f5b8b2; color: var(--chili-dark); }
.pf-alert.success { background: #e9f6ee; border: 1px solid #b7e0c6; color: var(--leaf); }

/* ---------- form ---------- */
.pf-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 18px; }
.pf-field { min-width: 0; }
.pf-field.full { grid-column: 1 / -1; }
.pf-field label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
.pf-field input, .pf-field textarea {
	width: 100%; min-width: 0;
	padding: 13px 14px;
	font: inherit; font-size: 15px; color: var(--ink);
	background: #fff;
	border: 1.5px solid var(--line);
	border-radius: 12px;
	transition: border-color .15s, box-shadow .15s;
}
.pf-field input { min-height: 48px; }
.pf-field textarea { min-height: 96px; resize: vertical; }
.pf-field input::placeholder, .pf-field textarea::placeholder { color: #b9aaa4; }
.pf-field input:focus, .pf-field textarea:focus {
	outline: none;
	border-color: var(--chili);
	box-shadow: 0 0 0 4px rgba(214, 40, 40, .14);
}
.pf-field input:disabled, .pf-field textarea:disabled {
	background: #faf5f1; color: #6b5c57; cursor: default;
}
.pf-field small { display: block; margin-top: 6px; color: var(--muted); font-size: 12px; }

.pf-actions {
	grid-column: 1 / -1;
	display: flex; justify-content: flex-end; gap: 12px;
	padding-top: 20px; border-top: 1px solid var(--line);
}

.pf-loading {
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	min-height: 50vh; gap: 14px; color: var(--muted);
}
.pf-loading .pf-spinner { width: 40px; height: 40px; border-color: var(--line); border-top-color: var(--chili); }

/* ---------- responsive ---------- */
@media (max-width: 860px) {
	.pf-layout { grid-template-columns: 1fr; }
	.pf-menu { flex-direction: row; flex-wrap: wrap; }
	.pf-menu button { flex: 1 1 150px; }
	.pf-menu .pf-logout { margin-top: 0; }
}
@media (max-width: 540px) {
	.pf { padding: 16px 12px 40px; }
	.pf-heading h1 { font-size: 28px; }
	.pf-content { padding: 20px 16px; }
	.pf-content-header { flex-direction: column; align-items: flex-start; }
	.pf-form { grid-template-columns: 1fr; gap: 18px; }
	.pf-actions { flex-wrap: wrap; }
	.pf-actions .pf-btn { flex: 1; }
}
@media (prefers-reduced-motion: reduce) {
	.pf-spinner { animation-duration: 2s; }
}
`;

export default function Profile() {
	const navigate = useNavigate();
	const fileInputRef = useRef(null);

	const [profile, setProfile] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [error, setError] = useState('');
	const [avatarError, setAvatarError] = useState('');
	const [success, setSuccess] = useState('');
	const [avatarPreview, setAvatarPreview] = useState('');
	const [avatarBroken, setAvatarBroken] = useState(false);

	const fetchProfile = useCallback(async () => {
		if (!getToken()) {
			navigate('/login', { replace: true });
			return;
		}

		setLoading(true);
		setError('');

		try {
			const response = await getMyProfile();
			const data = unwrapResponse(response);

			setProfile(data);
			setForm(normalizeProfile(data));
			setAvatarBroken(false);
		} catch (err) {
			if (err?.response?.status === 401) {
				logOut();
				navigate('/login', { replace: true });
				return;
			}

			console.error('Load profile failed:', err);
			setError(
				err?.response?.data?.message ||
				'Không thể tải thông tin tài khoản. Vui lòng thử lại.'
			);
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	// Giải phóng URL xem trước khi đổi ảnh hoặc rời trang.
	useEffect(() => {
		return () => {
			if (avatarPreview) URL.revokeObjectURL(avatarPreview);
		};
	}, [avatarPreview]);

	const handleChange = (event) => {
		const { name, value } = event.target;

		setForm((previous) => ({
			...previous,
			[name]: value,
		}));

		setError('');
		setSuccess('');
	};

	const handleCancel = () => {
		setForm(normalizeProfile(profile));
		setEditing(false);
		setError('');
		setSuccess('');
	};

	const handleSave = async (event) => {
		event.preventDefault();

		if (!getToken()) {
			navigate('/login', { replace: true });
			return;
		}

		setSaving(true);
		setError('');
		setSuccess('');

		const profileData = {
			firstName: form.firstName.trim(),
			lastName: form.lastName.trim(),
			phoneNumber: form.phoneNumber.trim(),
			dob: form.dob || null,
			address: form.address.trim(),
		};

		try {
			const response = await updateProfile(profileData);
			const updated = unwrapResponse(response);

			const merged = {
				...profile,
				...profileData,
				...updated,
			};

			setProfile(merged);
			setForm(normalizeProfile(merged));
			setEditing(false);
			setSuccess('Cập nhật thông tin cá nhân thành công!');
		} catch (err) {
			if (err?.response?.status === 401) {
				logOut();
				navigate('/login', { replace: true });
				return;
			}

			console.error('Update profile failed:', err);
			setError(
				err?.response?.data?.message ||
				'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.'
			);
		} finally {
			setSaving(false);
		}
	};

	const openAvatarPicker = () => {
		if (!uploading) fileInputRef.current?.click();
	};

	const handleAvatarChange = async (event) => {
		const file = event.target.files?.[0];
		event.target.value = '';

		if (!file) return;

		if (!file.type.startsWith('image/')) {
			setAvatarError('Vui lòng chọn tệp hình ảnh hợp lệ.');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			setAvatarError('Ảnh đại diện không được vượt quá 5 MB.');
			return;
		}

		if (!getToken()) {
			navigate('/login', { replace: true });
			return;
		}

		const formData = new FormData();

		// Đổi "file" nếu backend nhận tên multipart khác.
		formData.append('file', file);

		// Hiện ảnh mới ngay lập tức trong lúc tải lên.
		setAvatarPreview(URL.createObjectURL(file));
		setUploading(true);
		setAvatarError('');
		setError('');
		setSuccess('');

		try {
			await updateAvatar(formData);
			await fetchProfile();
			setAvatarPreview('');
			setSuccess('Cập nhật ảnh đại diện thành công!');
		} catch (err) {
			setAvatarPreview('');

			if (err?.response?.status === 401) {
				logOut();
				navigate('/login', { replace: true });
				return;
			}

			console.error('Update avatar failed:', err);
			setAvatarError(
				err?.response?.data?.message ||
				'Không thể tải ảnh lên. Vui lòng thử lại.'
			);
		} finally {
			setUploading(false);
		}
	};

	const handleLogout = () => {
		logOut();
		navigate('/login', { replace: true });
	};

	const fullName =
		`${form.firstName} ${form.lastName}`.trim() ||
		form.username ||
		'Người dùng Shop Meal';

	const initials = fullName.charAt(0).toUpperCase();
	const avatarSrc = avatarPreview || (!avatarBroken && form.avatar) || '';

	return (
		<div className="pf">
			<style>{styles}</style>

			<div className="pf-container">
				<div className="pf-topbar">
					<button type="button" className="pf-back" onClick={() => navigate('/')}>
						← Về trang chủ
					</button>

					<div className="pf-brand">
						<span className="pf-brand-badge" aria-hidden="true">🍲</span>
						Shop Meal
					</div>
				</div>

				<header className="pf-heading">
					<h1>Tài khoản của tôi</h1>
					<p>Quản lý thông tin cá nhân và ảnh đại diện của bạn.</p>
				</header>

				{loading && !profile ? (
					<div className="pf-loading">
						<div className="pf-spinner" />
						<p>Đang tải thông tin tài khoản...</p>
					</div>
				) : (
					<div className="pf-layout">
						<aside className="pf-sidebar">
							<div className="pf-user">
								<div className="pf-cover" aria-hidden="true" />

								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleAvatarChange}
									hidden
								/>

								<button
									type="button"
									className={`pf-avatar-btn${uploading ? ' is-uploading' : ''}`}
									onClick={openAvatarPicker}
									disabled={uploading}
									aria-label="Đổi ảnh đại diện"
									title="Nhấp để đổi ảnh đại diện"
								>
									{avatarSrc ? (
										<img
											className="pf-avatar-img"
											src={avatarSrc}
											alt="Ảnh đại diện"
											onError={() => setAvatarBroken(true)}
										/>
									) : (
										<span className="pf-avatar-fallback">{initials}</span>
									)}

									<span className="pf-avatar-overlay" aria-hidden="true">
										{uploading ? (
											<span className="pf-spinner" />
										) : (
											<>
												<span>📷</span>
												<span>Đổi ảnh</span>
											</>
										)}
									</span>

									{!uploading && (
										<span className="pf-avatar-badge" aria-hidden="true">📷</span>
									)}
								</button>

								<p className="pf-hint">
									{uploading ? 'Đang tải ảnh lên...' : 'Nhấp vào ảnh để thay đổi (tối đa 5 MB)'}
								</p>

								{avatarError && (
									<div className="pf-alert error" role="alert">
										{avatarError}
									</div>
								)}

								<h2>{fullName}</h2>
								<p className="pf-email">{form.email || 'Chưa cập nhật email'}</p>
							</div>

							<nav className="pf-menu">
								<button
									type="button"
									className="active"
									onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
								>
									<span>👤</span>
									Thông tin cá nhân
								</button>

								<button type="button" onClick={() => navigate('/orders')}>
									<span>📦</span>
									Đơn hàng của tôi
								</button>

								<button type="button" onClick={() => navigate('/change-password')}>
									<span>🔒</span>
									Bảo mật tài khoản
								</button>

								<button type="button" className="pf-logout" onClick={handleLogout}>
									<span>↪</span>
									Đăng xuất
								</button>
							</nav>
						</aside>

						<main className="pf-content">
							<div className="pf-content-header">
								<div>
									<h2>Thông tin cá nhân</h2>
									<p>Cập nhật thông tin tài khoản Shop Meal.</p>
								</div>

								{!editing && profile && (
									<button
										type="button"
										className="pf-btn primary"
										onClick={() => {
											setEditing(true);
											setError('');
											setSuccess('');
										}}
									>
										✎ Chỉnh sửa
									</button>
								)}
							</div>

							{error && (
								<div className="pf-alert error" role="alert">
									{error}
								</div>
							)}

							{success && (
								<div className="pf-alert success" role="status">
									{success}
								</div>
							)}

							{!profile ? (
								<div>
									<p>Chưa thể tải thông tin hồ sơ.</p>
									<button type="button" className="pf-btn primary" onClick={fetchProfile}>
										Thử tải lại
									</button>
								</div>
							) : (
								<form className="pf-form" onSubmit={handleSave}>
									<div className="pf-field">
										<label htmlFor="firstName">Họ</label>
										<input
											id="firstName"
											name="firstName"
											value={form.firstName}
											onChange={handleChange}
											disabled={!editing}
											placeholder="Nhập họ"
										/>
									</div>

									<div className="pf-field">
										<label htmlFor="lastName">Tên</label>
										<input
											id="lastName"
											name="lastName"
											value={form.lastName}
											onChange={handleChange}
											disabled={!editing}
											placeholder="Nhập tên"
										/>
									</div>

									<div className="pf-field">
										<label htmlFor="email">Email</label>
										<input id="email" type="email" value={form.email} disabled />
										<small>Email chỉ được xem, không chỉnh sửa tại đây.</small>
									</div>

									<div className="pf-field">
										<label htmlFor="username">Tên đăng nhập</label>
										<input
											id="username"
											value={form.username}
											disabled
											placeholder="Chưa có tên đăng nhập"
										/>
									</div>

									<div className="pf-field">
										<label htmlFor="phoneNumber">Số điện thoại</label>
										<input
											id="phoneNumber"
											name="phoneNumber"
											type="tel"
											value={form.phoneNumber}
											onChange={handleChange}
											disabled={!editing}
											placeholder="Nhập số điện thoại"
										/>
									</div>

									<div className="pf-field">
										<label htmlFor="dob">Ngày sinh</label>
										<input
											id="dob"
											name="dob"
											type="date"
											value={form.dob}
											onChange={handleChange}
											disabled={!editing}
										/>
									</div>

									<div className="pf-field full">
										<label htmlFor="address">Địa chỉ giao hàng</label>
										<textarea
											id="address"
											name="address"
											value={form.address}
											onChange={handleChange}
											disabled={!editing}
											placeholder="Nhập địa chỉ của bạn"
										/>
									</div>

									{editing && (
										<div className="pf-actions">
											<button
												type="button"
												className="pf-btn"
												onClick={handleCancel}
												disabled={saving}
											>
												Hủy
											</button>

											<button type="submit" className="pf-btn primary" disabled={saving}>
												{saving ? 'Đang lưu...' : '✓ Lưu thay đổi'}
											</button>
										</div>
									)}
								</form>
							)}
						</main>
					</div>
				)}
			</div>
		</div>
	);
}