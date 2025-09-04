import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../lib/api';

export default function Leaderboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['leaderboard','weekly'], queryFn: () => getLeaderboard('weekly') });
  if (isLoading) return <div style={{padding:16}}>Loading…</div>;
  if (isError) return <div style={{padding:16}}>Failed to load leaderboard.</div>;
  return (
    <div style={{padding:16, background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
      <h2 style={{fontSize:20, fontWeight:700, marginBottom:12}}>Weekly Leaderboard</h2>
      <table style={{width:'100%'}}>
        <thead>
          <tr style={{borderBottom:'1px solid #eee'}}>
            <th style={{textAlign:'left', padding:'8px 0'}}>Rank</th>
            <th style={{textAlign:'left'}}>Agent</th>
            <th style={{textAlign:'left'}}>Points</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((row: any, idx: number) => (
            <tr key={row.id} style={{borderBottom:'1px solid #f2f2f2'}}>
              <td style={{padding:'8px 0', fontWeight:600}}>{idx+1}</td>
              <td>{row.first_name} {row.last_name}</td>
              <td style={{fontWeight:700}}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
