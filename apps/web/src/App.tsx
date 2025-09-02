import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';

const qc = new QueryClient();
export default function App(){
  return (
    <QueryClientProvider client={qc}>
      <div style={{minHeight:'100vh', background:'#f7f7f7'}}>
        <header style={{padding:'12px 16px', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h1 style={{margin:0, fontSize:24, fontWeight:700}}>Priority Gamify</h1>
        </header>
        <Dashboard/>
      </div>
    </QueryClientProvider>
  );
}
