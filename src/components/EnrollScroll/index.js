import React, { useEffect, useRef } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

/* ---------------------------------------------------------------------------
   HID enrollment — scroll-driven walkthrough.

   Everything is a pure function of scroll progress p (0..1), so scrolling up
   runs the storyboard in reverse. The phone is a stack of full-phone
   screenshots that crossfade; the notification, keyboard, token and finger
   are overlay actors timed against the same p.

   Storyboard (see SCREENS centers + actor windows below):
     phone slides in → 01 scan QR → 02..05 sign in → 06 + 07 push notif drops
     → 08 open Ping → 09 number match → 10 loading → 11 authenticated →
     12 blur back to browser → 13 → 14 IAM portal → 15/16 quick loads → 17
     methods → 18 select method → 19 serial prompt (20 keyboard on top) →
     token plugs in + flashes, keyboard slides away → 21 → finger long-press
     (white 3s, 2 blinks, lift) types serial → 22 → 23 finger short-tap types
     OTP → 24 → 25 verifying → 26 token added.
--------------------------------------------------------------------------- */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const pulse = (p, inA, inB, outA, outB) =>
  span(p, inA, inB) * (1 - span(p, outA, outB));
const on = (p, a, b) => (p >= a && p < b ? 1 : 0);

// Full-phone screenshots (the phone itself), each with its center scroll pos.
const SCREENS = [
  { src: '/img/enroll/phone.png', p: 0.02 }, // home screen
  { src: '/img/enroll/screens/01_scan-qr-code.png', p: 0.06 },
  { src: '/img/enroll/screens/02_loading-login.png', p: 0.1 },
  { src: '/img/enroll/screens/03_login-username.png', p: 0.135 },
  { src: '/img/enroll/screens/04_login-password.png', p: 0.165 },
  { src: '/img/enroll/screens/05_select-device.png', p: 0.195 },
  { src: '/img/enroll/screens/06_open-ping-prompt.png', p: 0.225 },
  { src: '/img/enroll/screens/08_open-ping-app.png', p: 0.275 },
  { src: '/img/enroll/screens/09_ping-number-match.png', p: 0.305 },
  { src: '/img/enroll/screens/10_authenticating.png', p: 0.33 },
  { src: '/img/enroll/screens/11_authenticated.png', p: 0.355 },
  { src: '/img/enroll/screens/12_return-to-browser.png', p: 0.385 },
  { src: '/img/enroll/screens/13_browser-authenticated.png', p: 0.41 },
  { src: '/img/enroll/screens/14_iam-portal-home.png', p: 0.44 },
  { src: '/img/enroll/screens/15_ping-mfa-loading.png', p: 0.465 },
  { src: '/img/enroll/screens/16_auth-methods-loading.png', p: 0.48 },
  { src: '/img/enroll/screens/17_your-auth-methods.png', p: 0.5 },
  { src: '/img/enroll/screens/18_select-method.png', p: 0.53 },
  { src: '/img/enroll/screens/19_hardware-token-serial-prompt.png', p: 0.565 },
  { src: '/img/enroll/screens/21_hardware-token-serial-entry.png', p: 0.66 },
  { src: '/img/enroll/screens/22_hardware-token-serial-filled.png', p: 0.78 },
  { src: '/img/enroll/screens/23_hardware-token-passcode.png', p: 0.815 },
  { src: '/img/enroll/screens/24_hardware-token-verify.png', p: 0.86 },
  { src: '/img/enroll/screens/25_token-verifying.png', p: 0.9 },
  { src: '/img/enroll/screens/26_token-added.png', p: 0.95 },
];

// Left-column instructions, each anchored to a scroll position. They hold,
// then scroll up & fade as the next one rises into place.
const INSTRUCTIONS = [
  { p: 0.04, text: "Scan the QR code with your phone's Camera app. It opens the CVS Health Enterprise Login." },
  { p: 0.135, text: 'Enter your username.' },
  { p: 0.165, text: 'Enter your password.' },
  { p: 0.2, text: 'Choose an MFA method. This example uses the PingID mobile app.' },
  { p: 0.235, text: "You'll get a notification to switch to the PingID app to authenticate — note the number shown." },
  { p: 0.305, text: 'Authentication can use number matching, a push approval, or entered digits. Here it’s number matching — tap the matching number.' },
  { p: 0.335, text: 'After the number match, PingID confirms it’s you with Face ID.' },
  { p: 0.37, text: 'Once authenticated, switch back to your browser.' },
  { p: 0.41, text: 'Enterprise Login is complete.' },
  { p: 0.44, text: 'This is the Identity Management home — the Self-Service Portal.' },
  { p: 0.47, text: 'Select Ping MFA.' },
  { p: 0.5, text: 'Select Add Method.' },
  { p: 0.53, text: 'Select Hardware Token.' },
  { p: 0.61, text: 'Plug in the HID key. The keyboard disappears because the key types for you.' },
  { p: 0.73, text: 'Press and hold the key for ~3 seconds until it flashes, then lift off. The key types your serial number.' },
  { p: 0.795, text: 'Tap Next.' },
  { p: 0.825, text: 'The page asks for a one-time passcode (OTP). Short-tap the key and lift off quickly.' },
  { p: 0.86, text: 'This time the key types just 6 digits.' },
  { p: 0.89, text: 'Tap Verify.' },
  { p: 0.95, text: 'Done — your hardware key is registered with PingID.' },
];

// Teleprompter: current instruction sits at the anchor; as the next nears,
// the current scrolls up & fades while the next rises into place.
function instrStates(p, tw = 0.022, S = 78) {
  const c = INSTRUCTIONS;
  const n = c.length;
  const res = c.map(() => ({ op: 0, y: S }));
  if (p <= c[0].p) {
    res[0] = { op: 1, y: 0 };
    return res;
  }
  if (p >= c[n - 1].p) {
    res[n - 1] = { op: 1, y: 0 };
    return res;
  }
  for (let i = 0; i < n - 1; i++) {
    if (p >= c[i].p && p < c[i + 1].p) {
      const start = c[i + 1].p - tw;
      if (p < start) {
        res[i] = { op: 1, y: 0 };
      } else {
        const t = ease((p - start) / tw);
        res[i] = { op: 1 - t, y: -S * t };
        res[i + 1] = { op: t, y: S * (1 - t) };
      }
      return res;
    }
  }
  return res;
}

// Crossfade: hold each screen, then cross to the next over a short window
// before the next screen's center.
function screenOpacities(p, tw = 0.018) {
  const c = SCREENS;
  const n = c.length;
  const op = new Array(n).fill(0);
  if (p <= c[0].p) {
    op[0] = 1;
    return op;
  }
  if (p >= c[n - 1].p) {
    op[n - 1] = 1;
    return op;
  }
  for (let i = 0; i < n - 1; i++) {
    if (p >= c[i].p && p < c[i + 1].p) {
      const start = c[i + 1].p - tw;
      if (p < start) {
        op[i] = 1;
      } else {
        const t = ease((p - start) / tw);
        op[i] = 1 - t;
        op[i + 1] = t;
      }
      return op;
    }
  }
  return op;
}

function frame(p) {
  // ---- laptop opens the scene (QR on screen); phone slides over it, it fades
  const laptopOp = 1 - span(p, 0.04, 0.075);
  const laptopScale = lerp(1, 0.95, span(p, 0.0, 0.075));

  // ---- phone slides in from the right, over the laptop, then stays centered
  const phoneIn = ease(span(p, 0.0, 0.05));
  const phoneX = lerp(540, 0, phoneIn);
  const phoneY = lerp(20, -100, phoneIn);
  const phoneRot = lerp(8, 0, phoneIn);

  // ---- push notification (07) drops onto screen 06, then leaves
  const nIn = ease(span(p, 0.214, 0.232));
  const notifY = lerp(-150, 0, nIn); // % of own height
  const notifOp = pulse(p, 0.214, 0.232, 0.258, 0.272);

  // ---- keyboard (20) slides up over 19, then down off-screen as token flashes
  const kbIn = ease(span(p, 0.575, 0.6));
  const kbOut = ease(span(p, 0.628, 0.652));
  const kbY = clamp(110 * (1 - kbIn) + 110 * kbOut, 0, 110); // % of own height
  const kbOp = on(p, 0.572, 0.66);

  // ---- token plugs in from below into the bottom port (connector up)
  const dock = ease(span(p, 0.578, 0.638));
  const tokenY = lerp(560, 127, dock); // 560 = off-screen below, 127 = docked
  const tokenRot = lerp(195, 180, dock);

  // LED: brief blue flash on plug-in; white while finger presses the button
  const ledBlue = on(p, 0.626, 0.648);
  // long press (types serial → 22): white ~"3s", two off-blinks near the end
  const longPress =
    on(p, 0.695, 0.78) && !(on(p, 0.762, 0.768) || on(p, 0.772, 0.776));
  // short tap (types OTP → 24)
  const shortTap = on(p, 0.826, 0.842);
  const ledWhite = longPress || shortTap ? 1 : 0;

  // ---- finger actor: presses the HID button (docked token center ~ y127).
  // 👆 tip sits ~20px above the glyph center, so a press-center of y~160
  // lands the fingertip on the button at ~y140.
  let fOp = 0;
  let fx = 90;
  let fy = 240;
  let fs = 1;
  if (p >= 0.66 && p < 0.8) {
    // long press: approach → jab down onto button → hold → lift
    fOp = pulse(p, 0.665, 0.684, 0.786, 0.798);
    const approach = ease(span(p, 0.665, 0.7));
    const press = ease(span(p, 0.7, 0.716)) * (1 - ease(span(p, 0.776, 0.79)));
    fx = lerp(120, 8, approach);
    fy = lerp(255, 182, approach) - lerp(0, 22, press); // jab up onto the button
    fs = lerp(1, 0.86, press);
  } else if (p >= 0.81 && p < 0.862) {
    // short tap
    fOp = pulse(p, 0.812, 0.823, 0.848, 0.86);
    const approach = ease(span(p, 0.812, 0.824));
    const tap = ease(span(p, 0.826, 0.832)) * (1 - ease(span(p, 0.84, 0.847)));
    fx = lerp(110, 8, approach);
    fy = lerp(235, 182, approach) - lerp(0, 22, tap);
    fs = lerp(1, 0.86, tap);
  }

  return {
    laptop: `translate(-50%, -50%) translate(0px, -28px) scale(${laptopScale})`,
    laptopOp,
    phone: `translate(-50%, -50%) translate(${phoneX}px, ${phoneY}px) rotate(${phoneRot}deg)`,
    token: `translate(-50%, -50%) translate(0px, ${tokenY}px) rotate(${tokenRot}deg)`,
    notifY,
    notifOp,
    kbY,
    kbOp,
    ledBlue,
    ledWhite,
    finger: `translate(-50%, -50%) translate(${fx}px, ${fy}px) scale(${fs})`,
    fingerOp: fOp,
    screens: screenOpacities(p),
  };
}

export default function EnrollScroll() {
  const trackRef = useRef(null);
  const laptopRef = useRef(null);
  const instrRefs = useRef([]);
  const phoneRef = useRef(null);
  const screenRefs = useRef([]);
  const notifRef = useRef(null);
  const kbRef = useRef(null);
  const tokenRef = useRef(null);
  const ledWhiteRef = useRef(null);
  const ledBlueRef = useRef(null);
  const fingerRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const forced = new URLSearchParams(window.location.search).get('p');
    const pinned = forced !== null ? clamp(parseFloat(forced), 0, 1) : null;

    const render = () => {
      raf = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const p =
        pinned !== null
          ? pinned
          : clamp(-rect.top / Math.max(scrollable, 1), 0, 1);

      const f = frame(p);
      if (laptopRef.current) {
        laptopRef.current.style.opacity = f.laptopOp;
        laptopRef.current.style.transform = f.laptop;
      }
      instrStates(p).forEach((s, i) => {
        const el = instrRefs.current[i];
        if (el) {
          el.style.opacity = s.op;
          el.style.transform = `translateY(calc(-50% + ${s.y}px))`;
        }
      });
      if (phoneRef.current) phoneRef.current.style.transform = f.phone;
      if (tokenRef.current) tokenRef.current.style.transform = f.token;
      f.screens.forEach((o, i) => {
        const el = screenRefs.current[i];
        if (el) el.style.opacity = o;
      });
      if (notifRef.current) {
        notifRef.current.style.opacity = f.notifOp;
        notifRef.current.style.transform = `translateY(${f.notifY}%)`;
      }
      if (kbRef.current) {
        kbRef.current.style.opacity = f.kbOp;
        kbRef.current.style.transform = `translateY(${f.kbY}%)`;
      }
      if (ledWhiteRef.current) ledWhiteRef.current.style.opacity = f.ledWhite;
      if (ledBlueRef.current) ledBlueRef.current.style.opacity = f.ledBlue;
      if (fingerRef.current) {
        fingerRef.current.style.opacity = f.fingerOp;
        fingerRef.current.style.transform = f.finger;
      }
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(render);
    };
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={styles.track} ref={trackRef}>
      <div className={styles.stage}>
        {/* Left column: scrolling step instructions */}
        <div className={styles.instructions}>
          {INSTRUCTIONS.map((ins, i) => (
            <div
              key={ins.text}
              className={styles.instr}
              ref={(el) => (instrRefs.current[i] = el)}
              style={{ opacity: 0 }}>
              <div className={styles.instrNum}>{i + 1}</div>
              <p className={styles.instrText}>{ins.text}</p>
            </div>
          ))}
        </div>

        <div className={styles.sceneWrap}>
        <div className={styles.scene}>
          {/* Laptop opens the scene (QR on its screen), then fades out */}
          <img
            className={styles.laptop}
            ref={laptopRef}
            src={useBaseUrl('/img/enroll/laptop.png')}
            alt=""
            aria-hidden="true"
          />
          {/* Phone: stacked full-phone screenshots + screen overlays */}
          <div className={styles.phone} ref={phoneRef}>
            {SCREENS.map((s, i) => (
              <img
                key={s.src}
                className={styles.screenImg}
                ref={(el) => (screenRefs.current[i] = el)}
                style={{ opacity: i === 0 ? 1 : 0 }}
                src={useBaseUrl(s.src)}
                alt=""
                aria-hidden={i !== 0}
              />
            ))}
            {/* on-screen overlays, clipped to the phone's display area */}
            <div className={styles.screenMask}>
              <div className={styles.notif} ref={notifRef} style={{ opacity: 0 }}>
                <img
                  src={useBaseUrl('/img/enroll/screens/07_ping-push-notification.png')}
                  alt=""
                  aria-hidden="true"
                />
              </div>
              <div className={styles.keyboard} ref={kbRef} style={{ opacity: 0 }}>
                <img
                  src={useBaseUrl('/img/enroll/screens/20_hardware-token-serial-keyboard.png')}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* HID token — docks into the phone's bottom port; LED states stacked */}
          <div className={styles.keyWrap} ref={tokenRef}>
            <img
              className={styles.key}
              src={useBaseUrl('/img/enroll/key-off.png')}
              alt="HID security key"
            />
            <img
              className={styles.key}
              ref={ledWhiteRef}
              style={{ opacity: 0 }}
              src={useBaseUrl('/img/enroll/key-white.png')}
              alt=""
              aria-hidden="true"
            />
            <img
              className={styles.key}
              ref={ledBlueRef}
              style={{ opacity: 0 }}
              src={useBaseUrl('/img/enroll/key-blue.png')}
              alt=""
              aria-hidden="true"
            />
          </div>

          {/* finger that presses the token */}
          <div className={styles.finger} ref={fingerRef} style={{ opacity: 0 }}>
            👆
          </div>
        </div>
        </div>

        <div className={styles.scrollHint}>Scroll to play &middot; scroll up to reverse</div>
      </div>
    </div>
  );
}
