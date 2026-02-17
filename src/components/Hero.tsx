const heroStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '100px 20px',
  textAlign: 'center',
}

const buttonStyle: React.CSSProperties = {
  background: 'white',
  color: '#667eea',
  border: 'none',
  padding: '15px 40px',
  fontSize: '18px',
  borderRadius: '30px',
  cursor: 'pointer',
  marginTop: '20px',
}

export function Hero() {
  return (
    <section style={heroStyle}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        Welcome to the Future
      </h1>
      <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '30px' }}>
        Build amazing things with our powerful platform
      </p>
      <button style={buttonStyle}>Get Started</button>
    </section>
  )
}
