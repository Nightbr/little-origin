import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home(): JSX.Element {
	return (
		<Layout title="Little Origin" description="Find the perfect baby name together">
			<main>
				{/* Hero Section */}
				<section className="hero">
					<div className="hero__badge">Open Source • Self-Hosted • Private</div>
					<Heading as="h1" className="hero__title">
						Find the perfect baby name, together
					</Heading>
					<p className="hero__subtitle">
						A collaborative app for partners to discover and agree on baby names through an
						intuitive swipe interface. Real-time matching, global names, complete privacy.
					</p>
					<div className="hero__buttons">
						<Link className="button button--primary" to="/docs/deployment">
							Deploy Now
						</Link>
						<Link className="button button--secondary" to="/docs/intro">
							How it Works
						</Link>
					</div>
					<div className="hero__stats">
						<div className="stat">
							<div className="stat__value">52K+</div>
							<div className="stat__label">Baby Names</div>
						</div>
						<div className="stat">
							<div className="stat__value">7</div>
							<div className="stat__label">Countries</div>
						</div>
						<div className="stat">
							<div className="stat__value">100%</div>
							<div className="stat__label">Private</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="section">
					<div className="section__header">
						<Heading as="h2">Why Little Origin?</Heading>
						<p className="section__subtitle">
							Making the journey to find the perfect name joyful and collaborative
						</p>
					</div>

					<div className="features">
						<div className="feature feature--highlight">
							<div className="feature__icon feature__icon--large">💝</div>
							<h3 className="feature__title">Intuitive Swiping</h3>
							<p className="feature__text">
								Swipe right on names you love, left on names you don't. A familiar, engaging
								interface that makes exploring thousands of names feel like fun, not work.
							</p>
						</div>

						<div className="feature feature--highlight">
							<div className="feature__icon feature__icon--large">✨</div>
							<h3 className="feature__title">Real-time Matches</h3>
							<p className="feature__text">
								When both partners like the same name, celebrate together with instant match
								notifications. Build your shortlist of agreed-upon names.
							</p>
						</div>

						<div className="feature feature--highlight">
							<div className="feature__icon feature__icon--large">🌍</div>
							<h3 className="feature__title">Global Database</h3>
							<p className="feature__text">
								Explore names from 7 countries across multiple cultures. Filter by gender,
								popularity, origin, and more to find the perfect fit.
							</p>
						</div>
					</div>
				</section>

				{/* How It Works */}
				<section className="section section--alt">
					<div className="section__header">
						<Heading as="h2">How It Works</Heading>
						<p className="section__subtitle">Get started in three simple steps</p>
					</div>

					<div className="steps">
						<div className="step">
							<div className="step__number">1</div>
							<div className="step__content">
								<h3 className="step__title">Deploy Your Instance</h3>
								<p className="step__text">
									Run a single Docker Compose command to deploy Little Origin on your own server.
									Your data stays private and secure.
								</p>
							</div>
						</div>

						<div className="step">
							<div className="step__number">2</div>
							<div className="step__content">
								<h3 className="step__title">Invite Your Partner</h3>
								<p className="step__text">
									Create accounts for both partners and start exploring names together with
									real-time synchronization.
								</p>
							</div>
						</div>

						<div className="step">
							<div className="step__number">3</div>
							<div className="step__content">
								<h3 className="step__title">Find Your Matches</h3>
								<p className="step__text">
									Swipe through names, get instant matches when you both agree, and build your
									perfect shortlist together.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Trust Section */}
				<section className="section">
					<div className="section__header">
						<Heading as="h2">Built for Privacy</Heading>
						<p className="section__subtitle">Your data belongs to you, always</p>
					</div>

					<div className="features">
						<div className="feature">
							<div className="feature__icon">🏠</div>
							<h3 className="feature__title">Self-Hosted</h3>
							<p className="feature__text">
								Deploy on your own infrastructure. Complete control over your data and who has
								access to it.
							</p>
						</div>

						<div className="feature">
							<div className="feature__icon">🔒</div>
							<h3 className="feature__title">Secure by Default</h3>
							<p className="feature__text">
								JWT authentication with Argon2 password hashing. Your data encrypted at rest and in
								transit.
							</p>
						</div>

						<div className="feature">
							<div className="feature__icon">🚫</div>
							<h3 className="feature__title">No Tracking</h3>
							<p className="feature__text">
								No analytics, no ads, no third-party sharing. We don't track your behavior or sell
								your data.
							</p>
						</div>

						<div className="feature">
							<div className="feature__icon">🛠️</div>
							<h3 className="feature__title">Easy Deployment</h3>
							<p className="feature__text">
								Single Docker Compose command. Automatic migrations. Health checks included.
								Production-ready out of the box.
							</p>
						</div>

						<div className="feature">
							<div className="feature__icon">📖</div>
							<h3 className="feature__title">Open Source</h3>
							<p className="feature__text">
								Fully transparent codebase. Contribute, audit, or customize it for your needs.
								Community-driven development.
							</p>
						</div>

						<div className="feature">
							<div className="feature__icon">⚡</div>
							<h3 className="feature__title">Modern Tech</h3>
							<p className="feature__text">
								Built with React, GraphQL, and SQLite. Fast, reliable, and easy to maintain.
							</p>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="cta">
					<div className="cta__content">
						<Heading as="h2">Ready to find the perfect name?</Heading>
						<p className="cta__text">
							Join hundreds of families using Little Origin to discover names they both love. Deploy
							in minutes with Docker Compose.
						</p>
						<div className="cta__buttons">
							<Link className="button button--primary button--large" to="/docs/deployment">
								Get Started Free
							</Link>
							<a
								className="button button--secondary button--large"
								href="https://github.com/Nightbr/little-origin"
							>
								Star on GitHub
							</a>
						</div>
					</div>
				</section>
			</main>
		</Layout>
	);
}
