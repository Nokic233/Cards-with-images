import { Link } from "react-router";

export default function HorizontalTiles() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <h1 style={{ 
        color: 'white', 
        fontSize: '3rem',
        marginBottom: '2rem',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        Horizontal Tiles
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem' }}>
        这个页面正在开发中...
      </p>
      <Link 
        to="/Cards-Circle" 
        style={{ 
          marginTop: '2rem',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          transition: 'background 0.3s'
        }}
      >
        返回 Cards Circle
      </Link>
    </div>
  );
}
