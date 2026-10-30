
import { useEffect, useState } from 'react';
import { getBanner } from '../service/postService';

export default function Banner() {
	const [banners, setBanners] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const fetchBanners = async () => {
			try {
				const response = await getBanner();
				const data = response.data;

				const list = Array.isArray(data)
					? data
					: data?.results ?? data?.data ?? [];

				setBanners(Array.isArray(list) ? list : []);
			} catch (err) {
				console.error('Lỗi khi tải banner:', err);
				setError('Không thể tải banner. Vui lòng thử lại sau.');
			} finally {
				setLoading(false);
			}
		};

		fetchBanners();
	}, []);

	useEffect(() => {
		if (banners.length <= 1) return;

		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % banners.length);
		}, 5000);

		return () => clearInterval(timer);
	}, [banners.length]);

	const goToPrevious = () => {
		setCurrentIndex((prev) =>
			prev === 0 ? banners.length - 1 : prev - 1
		);
	};

	const goToNext = () => {
		setCurrentIndex((prev) => (prev + 1) % banners.length);
	};

	const styles = {
		container: {
			width: '100%',
			maxWidth: '1440px',
			margin: '0 auto',
			padding: '16px 20px',
			boxSizing: 'border-box',
		},
		slider: {
			position: 'relative',
			width: '100%',
			height: 'clamp(200px, 35vw, 480px)',
			overflow: 'hidden',
			borderRadius: '20px',
			background: '#f3f4f6',
			boxShadow: '0 8px 28px rgba(0, 0, 0, 0.10)',
		},
		track: {
			display: 'flex',
			width: '100%',
			height: '100%',
			transform: `translateX(-${currentIndex * 100}%)`,
			transition: 'transform 600ms ease-in-out',
		},
		slide: {
			flex: '0 0 100%',
			width: '100%',
			minWidth: 0,
			height: '100%',
			position: 'relative',
		},
		image: {
			display: 'block',
			width: '100%',
			height: '100%',
			objectFit: 'cover',
		},
		overlay: {
			position: 'absolute',
			inset: 0,
			background:
				'linear-gradient(90deg, rgba(0,0,0,0.48), rgba(0,0,0,0.04) 75%)',
			pointerEvents: 'none',
		},
		caption: {
			position: 'absolute',
			left: 'clamp(20px, 5vw, 64px)',
			bottom: 'clamp(24px, 6vw, 64px)',
			maxWidth: '65%',
			color: '#ffffff',
			textShadow: '0 2px 8px rgba(0,0,0,0.35)',
			pointerEvents: 'none',
		},
		title: {
			margin: '0 0 10px',
			fontSize: 'clamp(20px, 3.5vw, 42px)',
			fontWeight: 800,
			lineHeight: 1.2,
		},
		description: {
			margin: 0,
			fontSize: 'clamp(12px, 1.5vw, 18px)',
			lineHeight: 1.5,
		},
		arrow: {
			position: 'absolute',
			top: '50%',
			transform: 'translateY(-50%)',
			zIndex: 2,
			width: '44px',
			height: '44px',
			border: 'none',
			borderRadius: '50%',
			background: 'rgba(255,255,255,0.88)',
			color: '#222222',
			fontSize: '26px',
			cursor: 'pointer',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
		},
		dots: {
			position: 'absolute',
			zIndex: 2,
			bottom: '18px',
			left: '50%',
			transform: 'translateX(-50%)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: '9px',
		},
		dot: {
			width: '10px',
			height: '10px',
			padding: 0,
			border: 'none',
			borderRadius: '50%',
			cursor: 'pointer',
			transition: 'all 250ms ease',
		},
		message: {
			padding: '50px 16px',
			textAlign: 'center',
			color: '#6b7280',
		},
		error: {
			padding: '30px 16px',
			textAlign: 'center',
			color: '#dc2626',
		},
	};

	if (loading) {
		return (
			<div style={styles.container}>
				<div style={styles.message}>Đang tải banner...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div style={styles.container}>
				<div style={styles.error}>{error}</div>
			</div>
		);
	}

	if (banners.length === 0) {
		return (
			<div style={styles.container}>
				<div style={styles.message}>Hiện chưa có banner nào.</div>
			</div>
		);
	}

	return (
		<section
			style={styles.container}
			aria-label="Banner Shop Meal"
		>
			<div style={styles.slider}>
				<div style={styles.track}>
					{banners.map((banner, index) => {
						const imageUrl =
							banner.image ?? banner.imageUrl ?? banner.url;

						return (
							<div key={banner.id ?? banner._id ?? index} style={styles.slide}>
								{imageUrl ? (
									<img
										src={imageUrl}
										alt={banner.title ?? `Banner ${index + 1}`}
										style={styles.image}
										loading={index === 0 ? 'eager' : 'lazy'}
									/>
								) : (
									<div style={styles.message}>
										Banner chưa có hình ảnh.
									</div>
								)}

								{(banner.title || banner.description) && (
									<>
										<div style={styles.overlay} />
										<div style={styles.caption}>
											{banner.title && (
												<h2 style={styles.title}>{banner.title}</h2>
											)}
											{banner.description && (
												<p style={styles.description}>
													{banner.description}
												</p>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>

				{banners.length > 1 && (
					<>
						<button
							type="button"
							onClick={goToPrevious}
							aria-label="Banner trước"
							style={{ ...styles.arrow, left: '16px' }}
						>
							&#8249;
						</button>

						<button
							type="button"
							onClick={goToNext}
							aria-label="Banner tiếp theo"
							style={{ ...styles.arrow, right: '16px' }}
						>
							&#8250;
						</button>

						<div style={styles.dots}>
							{banners.map((banner, index) => (
								<button
									key={banner.id ?? banner._id ?? index}
									type="button"
									aria-label={`Chuyển đến banner ${index + 1}`}
									aria-current={currentIndex === index ? 'true' : undefined}
									onClick={() => setCurrentIndex(index)}
									style={{
										...styles.dot,
										width: currentIndex === index ? '26px' : '10px',
										borderRadius: '10px',
										background:
											currentIndex === index
												? '#f97316'
												: 'rgba(255,255,255,0.85)',
									}}
								/>
							))}
						</div>
					</>
				)}
			</div>
		</section>
	);
}
