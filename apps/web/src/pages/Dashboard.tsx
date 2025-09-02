import Leaderboard from '../components/Leaderboard';

export default function Dashboard(){
  return (
    <div style={{maxWidth:1000, margin:'16px auto', padding:'0 16px'}}>
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
        <div><Leaderboard/></div>
        <div style={{padding:16, background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:18, fontWeight:700, marginBottom:8}}>Active Challenges</h3>
          <p style={{opacity:0.7, margin:0}}>Manager-created challenges with live progress (coming in Phase 2).</p>
        </div>
      </div>
    </div>
  );
}
