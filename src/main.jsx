import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

class RootErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      const stack = this.state.error?.stack
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', direction: 'rtl', maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ color: '#b91c1c' }}>حدث خطأ أثناء التشغيل</h1>
          <p style={{ color: '#334155', marginBottom: 12 }}>تم إيقاف الشاشة البيضاء وعرض الخطأ هنا.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f1f5f9', padding: 16, borderRadius: 8, fontSize: 13 }}>
            {this.state.error?.message || String(this.state.error)}
            {stack ? `\n\n${stack}` : ''}
          </pre>
          <p style={{ color: '#64748b', marginTop: 12 }}>افتح أدوات المطوّر (F12) → Console لمزيد من التفاصيل.</p>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('عنصر #root غير موجود في index.html')
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
)
