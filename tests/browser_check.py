#!/usr/bin/env python3
"""Real-browser check (optional). Needs:  pip install playwright && playwright install chromium
Plays the lesson's first slide, every skill station (with real taps on the diagram), and opens every scenario
at phone sizes. Fails on any JavaScript error or anything off-screen.   Usage: python3 tests/browser_check.py"""
import pathlib, sys, re
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
OVER = "(()=>{let m=0;document.querySelectorAll('body *').forEach(e=>{if(e.offsetParent===null)return;const r=e.getBoundingClientRect();m=Math.max(m,r.right-window.innerWidth);});return Math.round(m);})()"
SMALL = "(()=>{let n=0;document.querySelectorAll('button').forEach(e=>{if(e.offsetParent===null)return;const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight)return;if(r.height<44)n++;});return n;})()"
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
        pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'home', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True))
        pg.click('#h-learn'); pg.wait_for_timeout(200); rows.append((w, 'lesson', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True)); pg.click('[data-l="quit"]')
        pg.click('#h-set'); pg.wait_for_timeout(150); rows.append((w, 'settings', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True)); pg.click('#set-close')
        pg.evaluate("localStorage.setItem('bleed-control',JSON.stringify({inst:true,runs:[]}))"); pg.goto(URL); pg.wait_for_timeout(200); pg.click('[data-sc="garage"]'); pg.wait_for_timeout(150); pg.click('#brief-go'); pg.wait_for_timeout(400); pg.click('#inst-fab'); pg.wait_for_timeout(200); rows.append((w, 'instructor', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True)); pg.click('#inst-close'); pg.evaluate("localStorage.removeItem('bleed-control')")
        pg.goto(URL+'?drill=threat'); pg.wait_for_timeout(300); rows.append((w, 'daily link', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)) + (0 if pg.is_visible('#drillov') else 99), True))
        pg.evaluate("localStorage.setItem('preconnect-drill',JSON.stringify({on:true,inst:'Max',roster:['Jo','Sam'],who:'',start:new Date().toISOString()}))"); pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'drill picker', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True)); pg.click('.pc-drill-name'); pg.wait_for_timeout(200); rows.append((w, 'drill bar', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True)); pg.evaluate("localStorage.removeItem('preconnect-drill')")
        pg.goto(URL); pg.wait_for_timeout(200); pg.click('#h-drills'); pg.wait_for_timeout(200); pg.locator('[data-d="go"]', has_text='Kit check').first.click(); pg.wait_for_timeout(250)   # the kit check played to the end, answers tapped by their visible text
        for _ in range(8):
            ans = pg.evaluate("DR.qs[DR.i].a"); pg.locator('[data-q="ans"]', has_text=re.compile('^' + re.escape(ans) + '$')).first.click(); pg.wait_for_timeout(150); pg.locator('[data-q="next"]').first.click(); pg.wait_for_timeout(150)
        rows.append((w, 'kit check (full)', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), pg.evaluate("(JSON.parse(localStorage.getItem('bleed-control')||'{}').runs||[]).some(r=>r.id==='kit'&&r.score===100)")))
        for st in ('tq-arm','tq-leg','pack','press'):
            pg.goto(URL); pg.wait_for_timeout(200); pg.click(f'[data-st="{st}"]'); pg.wait_for_timeout(200)
            rows.append((w, st, (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), station(pg)))
        for sc in ('kitchen','garage','glass','crash'):
            pg.goto(URL); pg.wait_for_timeout(200); pg.click(f'[data-sc="{sc}"]'); pg.wait_for_timeout(150); pg.click('#brief-go'); pg.wait_for_timeout(700)
            rows.append((w, sc, (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True))
        pg.close()
        if w == 390:   # a REAL finger tap takes ~0.25 s between touch and release — the app must not swallow it
            pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(URL); pg.wait_for_timeout(200); pg.click('[data-sc="garage"]'); pg.wait_for_timeout(150); pg.click('#brief-go'); pg.wait_for_timeout(600)
            def slow_tap(sel):
                pg.locator(sel).first.scroll_into_view_if_needed(); pg.wait_for_timeout(150)   # a person scrolls to the button first
                box = pg.locator(sel).first.bounding_box(); pg.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2)
                pg.mouse.down(); pg.wait_for_timeout(260); pg.mouse.up(); pg.wait_for_timeout(300)
            hits = 0
            for i in range(6):
                before = pg.evaluate("S.talks"); slow_tap('[data-a="talk"]'); hits += pg.evaluate("S.talks") > before
            rows.append((w, 'slow taps (Talk ×6)', 0 if hits == 6 else 99, hits == 6))
            pg.goto(URL); pg.wait_for_timeout(200); pg.click('[data-st="pack"]'); pg.wait_for_timeout(1200)
            order1 = pg.locator('#st-btns button').all_text_contents(); pg.wait_for_timeout(1500); order2 = pg.locator('#st-btns button').all_text_contents()
            slow_tap('[data-s="pressfirst"]'); ok = pg.evaluate("ST&&ST.phase==='packing'")
            rows.append((w, 'packing choices stay put + slow tap', 0 if (order1 == order2 and ok) else 99, order1 == order2 and ok))
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2, is_mobile=True, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(300)
    if pg.is_visible('#b-start'): pg.click('#b-start'); pg.wait_for_timeout(200)
    rows.append((844, 'landscape', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True))
    pg.evaluate("localStorage.setItem('preconnect-settings',JSON.stringify({contrast:'day'}))"); pg.goto(URL); pg.wait_for_timeout(300)
    if pg.is_visible('#b-start'): pg.click('#b-start'); pg.wait_for_timeout(200)
    rows.append((844, 'daylight', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True))
    pg.click('#h-set'); pg.wait_for_timeout(200)
    rows.append((844, 'settings land', (pg.evaluate(OVER)+1000*pg.evaluate(SMALL)), True))
    pg.close()
    b.close()
bad = [r for r in rows if r[2] > 1 or not r[3]]
rows=[r if len(r)==4 else (r[0],r[1],r[2],True) for r in rows]
for r in rows: print(f"{'PASS' if r[2] <= 1 and r[3] else 'FAIL'}  {r[0]}px  {r[1]:<8} overflow {r[2]%1000}px · buttons under 44px: {r[2]//1000}{'' if r[3] else '  (station did not complete)'}")
print('JavaScript errors:', errs or 'none')
sys.exit(1 if bad or errs else 0)
