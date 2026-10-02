#!/usr/bin/env python3
"""Real-browser check (optional). Needs:  pip install playwright && playwright install chromium
Plays the lesson's first slide, every skill station (with real taps on the diagram), and opens every scenario
at phone sizes. Fails on any JavaScript error or anything off-screen.   Usage: python3 tests/browser_check.py"""
import pathlib, sys
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
OVER = "(()=>{let m=0;document.querySelectorAll('body *').forEach(e=>{if(e.offsetParent===null)return;const r=e.getBoundingClientRect();m=Math.max(m,r.right-window.innerWidth);});return Math.round(m);})()"
errs, rows = [], []
def station(pg):
    for _ in range(60):
        if not pg.is_visible('#stov'): return True
        ph = pg.evaluate("ST&&ST.phase")
        if ph in ('place', 'place2'):
            good = pg.evaluate("ST.phase==='place2'?'abovefirst':ST.near?'abovejoint':'above'")
            pg.click(f'#st-art [data-z="{good}"] rect'); continue
        for a in ('pull','totwist','twist','lock','second','time','pressfirst','pack','cover','addon'):
            if pg.is_visible(f'[data-s="{a}"]'):
                if a == 'pull' and pg.evaluate("ST.tension")>=100: continue
                pg.click(f'[data-s="{a}"]'); break
        else:
            if pg.is_visible('[data-s="hold"]') and not pg.evaluate("ST.holding"): pg.click('[data-s="hold"]')
            pg.wait_for_timeout(1000)
        pg.wait_for_timeout(60)
    return not pg.is_visible('#stov')
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (320, 390):
        pg = b.new_page(viewport={'width': w, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'home', pg.evaluate(OVER), True))
        pg.click('#h-learn'); pg.wait_for_timeout(200); rows.append((w, 'lesson', pg.evaluate(OVER), True)); pg.click('[data-l="quit"]')
        for st in ('tq-arm','tq-leg','pack','press'):
            pg.goto(URL); pg.wait_for_timeout(200); pg.click(f'[data-st="{st}"]'); pg.wait_for_timeout(200)
            rows.append((w, st, pg.evaluate(OVER), station(pg)))
        for sc in ('kitchen','garage','glass','crash'):
            pg.goto(URL); pg.wait_for_timeout(200); pg.click(f'[data-sc="{sc}"]'); pg.wait_for_timeout(150); pg.click('#brief-go'); pg.wait_for_timeout(700)
            rows.append((w, sc, pg.evaluate(OVER), True))
        pg.close()
    b.close()
bad = [r for r in rows if r[2] > 1 or not r[3]]
for r in rows: print(f"{'PASS' if r[2] <= 1 and r[3] else 'FAIL'}  {r[0]}px  {r[1]:<8} overflow {r[2]}px{'' if r[3] else '  (station did not complete)'}")
print('JavaScript errors:', errs or 'none')
sys.exit(1 if bad or errs else 0)
