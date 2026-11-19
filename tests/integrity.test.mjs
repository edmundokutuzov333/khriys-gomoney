import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('no face-generation or text-overlay code or additional titles in canvas',()=>{
 const film=readFileSync('public/src/film.js','utf8');
 assert.equal(film.includes('fillText('),false);assert.equal(film.includes('strokeText('),false);
 assert.equal(film.includes('face-api'),false);assert.equal(film.includes('transform: scaleX(-1)'),false);
 assert.ok(film.includes('drawImage(img,s.sx,s.sy,s.sw,s.sh'));
});
test('original MP3 remains canonical and runtime playback is local',()=>{
 const html=readFileSync('public/index.html','utf8');assert.ok(html.includes('src="/walk_to_the_bank.mp3"'));
 const prepare=readFileSync('scripts/prepare.mjs','utf8');assert.ok(prepare.includes('copyFileSync(source,destination)'));
});
test('no network downloads or paid service in runtime',()=>{
 const pkg=JSON.parse(readFileSync('package.json','utf8'));assert.ok(!pkg.dependencies);assert.ok(!pkg.devDependencies);
 const app=readFileSync('public/src/app.js','utf8');assert.ok(!app.includes('magnific'));assert.ok(!app.includes('openai.com'));
});
