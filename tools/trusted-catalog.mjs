import {readFileSync} from 'node:fs';
const reviewed=JSON.parse(readFileSync(new URL('../trusted-features/reviewed.json',import.meta.url),'utf8'));
function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
 return JSON.stringify(value);
}
export function validateTrustedListing(value){
 if(!reviewed.some(entry=>canonical(entry)===canonical(value)))throw new Error('功能插件与管理员受审定义不一致');
 return value;
}
export function buildTrustedCatalog(ordinary,features=reviewed){
 const identities=new Set(ordinary.plugins.map(entry=>entry.id));
 for(const entry of features){
  validateTrustedListing(entry);
  if(identities.has(entry.id))throw new Error('功能插件重复');
  identities.add(entry.id);
 }
 return {format:'vitalk-plugin-catalog/v2',plugins:[...ordinary.plugins,...features]};
}
export async function verifyTrustedArtifacts(features=reviewed){
 const {createHash}=await import('node:crypto');
 for(const entry of features){
  validateTrustedListing(entry);
  const response=await fetch(entry.artifact.url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('功能包Release下载失败');
  const parts=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>2000000)throw new Error('功能包超过大小限制');parts.push(chunk);}
  const bytes=Buffer.concat(parts);
  if(size!==entry.artifact.size||createHash('sha256').update(bytes).digest('hex')!==entry.artifact.sha256)throw new Error('功能包Release字节与受审摘要不一致');
 }
}
