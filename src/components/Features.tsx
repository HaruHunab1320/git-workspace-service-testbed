const sectionStyle: React.CSSProperties = {
  padding: '80px 20px',
  textAlign: 'center',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '30px',
  maxWidth: '1200px',
  margin: '40px auto 0',
}

const cardStyle: React.CSSProperties = {
  padding: '40px 30px',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}

const features = [
  { icon: '🚀', title: 'Fast', desc: 'Lightning fast performance' },
  { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' },
  { icon: '📱', title: 'Responsive', desc: 'Works on any device' },
]

export function Features() {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '36px' }}>Features</h2>
      <div style={gridStyle}>
        {features.map((f, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontSize: '48px' }}>{f.icon}</div>
            <h3 style={{ margin: '20px 0 10px' }}>{f.title}</h3>
            <p style={{ color: '#666' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
