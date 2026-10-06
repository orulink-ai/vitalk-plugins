import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildTrustedCatalog,validateTrustedListing} from './trusted-catalog.mjs';
const reviewed=JSON.parse(readFileSync(new URL('../trusted-features/reviewed.json',import.meta.url)));
test('v2 lists three exact reviewed features, preserving community entries',()=>{
 const ordinary={id:'community.example'};
 const result=buildTrustedCatalog({format:'vitalk-plugin-catalog/v1',plugins:[ordinary]},reviewed);
 assert.equal(result.format,'vitalk-plugin-catalog/v2');assert.equal(result.plugins.length,4);
});
test('modified permission, hash, source repository and identity are rejected',()=>{
 for(const change of [{permissions:['history.read']},{artifact:{...reviewed[0].artifact,sha256:'a'.repeat(64)}},{repository:'https://github.com/attacker/plugin'},{id:'vitalk.fake'}])
 assert.throws(()=>validateTrustedListing({...reviewed[0],...change}),/受审/);
});
test('duplicates cannot turn one approved feature into multiple listings',()=>{
 assert.throws(()=>buildTrustedCatalog({plugins:[]},[reviewed[0],reviewed[0]]),/重复/);
});
