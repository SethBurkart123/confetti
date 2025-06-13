class Vector {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  
    scale(k) {
      return new Vector(this.x * k, this.y * k);
    }
  
    clone() {
      return new Vector(this.x, this.y);
    }
  }
  
  class ConfettiConfig {
    constructor() {
      this.gravity = 10;
      this.particle_count = 75;
      this.particle_size = 1;
      this.explosion_power = 25;
      this.destroy_target = false;
      this.fade = false;
      this.fade_speed = 1;
    }
  }
  
  class ConfettiParticle {
    constructor(origin) {
      const c = Confetti.CONFIG;
  
      this.size = new Vector(
        (Math.random() * 16 + 4) * c.particle_size,
        (Math.random() * 4 + 4) * c.particle_size
      );
  
      this.position = new Vector(
        origin.x - this.size.x / 2,
        origin.y - this.size.y / 2
      );
  
      this.velocity = ConfettiParticle.randomVelocity();
  
      this.rotation = Math.random() * 360;
      this.rotation_speed = 10 * (Math.random() - 0.5);
      this.hue = Math.random() * 360;
      this.opacity = 100;
      this.lifetime = Math.random() + 0.25;
    }
  
    update(dt) {
      const c = Confetti.CONFIG;
  
      this.velocity.y += c.gravity * (this.size.y / (10 * c.particle_size)) * dt;
  
      this.velocity.x += 25 * (Math.random() - 0.5) * dt;
  
      this.velocity.x *= 0.98;
      this.velocity.y *= 0.98;
  
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
  
      this.rotation += this.rotation_speed;
  
      if (c.fade) this.opacity -= this.lifetime * c.fade_speed;
    }
  
    isOffScreen() {
      return this.position.y - 2 * this.size.x > window.innerHeight * 2;
    }
  
    draw() {
      Screen.drawRectangle(
        this.position,
        this.size,
        this.rotation,
        this.hue,
        this.opacity
      );
    }
  
    static randomVelocity() {
      const c = Confetti.CONFIG;
      let vx = Math.random() - 0.5;
      let vy = Math.random() - 0.7;
  
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;
  
      return new Vector(
        vx * (Math.random() * c.explosion_power),
        vy * (Math.random() * c.explosion_power)
      );
    }
  }
  
  class ConfettiBurst {
    constructor(origin) {
      this.particles = [];
      for (let i = 0; i < Confetti.CONFIG.particle_count; i += 1) {
        this.particles.push(new ConfettiParticle(origin));
      }
    }
  
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.update(dt);
        if (p.isOffScreen()) {
          this.particles.splice(i, 1);
        }
      }
    }
  
    draw() {
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        this.particles[i].draw();
      }
    }
  }
  
  class Screen {
    static clear() {
      if (Confetti.CTX) {
        Confetti.CTX.clearRect(
          0,
          0,
          window.innerWidth * 2,
          window.innerHeight * 2
        );
      }
    }
  
    static drawRectangle(pos, size, rotationDeg, hue, opacity) {
      const ctx = Confetti.CTX;
      if (!ctx) return;
  
      ctx.save();
      ctx.beginPath();
  
      ctx.translate(pos.x + size.x / 2, pos.y + size.y / 2);
  
      ctx.rotate((rotationDeg * Math.PI) / 180);
  
      ctx.rect(-size.x / 2, -size.y / 2, size.x, size.y);
      ctx.fillStyle = `hsla(${hue}deg, 90%, 65%, ${opacity}%)`;
      ctx.fill();
  
      ctx.restore();
    }
  }
  
  class Confetti {
    constructor(target = document.body) {
      this.time = Date.now();
      this.delta_time = 0;
  
      this.bursts = [];
  
      if (!Confetti.CONFIG) Confetti.CONFIG = new ConfettiConfig();
  
      this._setupCanvas();
  
      this._setupElement(target);
  
      this._setupKeyboard();
  
      this._setupGlobalClick();
  
      this._update = this._update.bind(this);
      requestAnimationFrame(this._update);
    }
  
    setCount(val) {
      this._assertType(val, "number");
      Confetti.CONFIG.particle_count = val;
    }
    setPower(val) {
      this._assertType(val, "number");
      Confetti.CONFIG.explosion_power = val;
    }
    setSize(val) {
      this._assertType(val, "number");
      Confetti.CONFIG.particle_size = val;
    }
    setFade(val) {
      this._assertType(val, "boolean");
      Confetti.CONFIG.fade = val;
    }
    setFadeSpeed(val) {
      this._assertType(val, "number");
      Confetti.CONFIG.fade_speed = val;
    }
    destroyTarget(val) {
      this._assertType(val, "boolean");
      Confetti.CONFIG.destroy_target = val;
    }
  
    _assertType(value, expected) {
      if (typeof value !== expected) {
        throw new Error(`Input must be of type '${expected}'`);
      }
    }
  
    _setupCanvas() {
      // If the canvas was previously created but removed from the DOM, re-attach it.
      if (Confetti.CANVAS && !Confetti.CANVAS.isConnected) {
        document.body.appendChild(Confetti.CANVAS);
      }
  
      if (Confetti.CTX) return;
  
      const canvas = document.createElement("canvas");
      Confetti.CANVAS = canvas;
      Confetti.CTX = canvas.getContext("2d");
  
      const resize = () => {
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
      };
      resize();
      window.addEventListener("resize", resize);
  
      Object.assign(canvas.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        margin: 0,
        padding: 0,
        zIndex: 999999999,
        pointerEvents: "none",
      });
  
      document.body.appendChild(canvas);
    }
  
    _setupElement(target) {
      if (typeof target === "string") {
        this.element = document.getElementById(target);
        if (!this.element) {
          throw new Error(`No element found with id '${target}'`);
        }
      } else if (target instanceof HTMLElement) {
        this.element = target;
      } else {
        throw new Error("Target must be a DOM element or element id string");
      }
  
      // If the target is not body, attach its own click handler (global click handler already handles body)
      if (this.element !== document.body) {
        this.element.addEventListener("click", (evt) => {
          const origin = new Vector(evt.clientX * 2, evt.clientY * 2);
          this._spawnClickBurst(origin);
  
          if (Confetti.CONFIG.destroy_target) {
            this.element.style.visibility = "hidden";
          }
        });
      }
    }
  
    _setupKeyboard() {
      this._onKeyUp = (evt) => {
        const { x, y } = Confetti._getCaretPosition(evt.target);
        if (x !== undefined && y !== undefined) {
          const offsetY = 10; // shift confetti slightly below caret
          const origin = new Vector(x * 2, (y + offsetY) * 2);

          // Spawn a milder burst for typing: fewer particles and lower power
          const cfg = Confetti.CONFIG;
          const originalCount = cfg.particle_count;
          const originalPower = cfg.explosion_power;

          cfg.particle_count = Math.max(3, Math.floor(originalCount / 12));
          cfg.explosion_power = Math.max(4, originalPower / 5);

          this.bursts.push(new ConfettiBurst(origin));

          // restore original settings
          cfg.particle_count = originalCount;
          cfg.explosion_power = originalPower;
        }
      };
  
      document.addEventListener("keyup", this._onKeyUp, true);
    }
  
    _setupGlobalClick() {
      // Capture phase to avoid stopPropagation in page scripts / shadow DOM hosts
      document.addEventListener(
        "click",
        (evt) => {
          if (evt.composedPath && evt.composedPath().length > 0) {
            const origin = new Vector(evt.clientX * 2, evt.clientY * 2);
            this._spawnClickBurst(origin);
          }
        },
        true
      );
    }
  
    // Helper that spawns a randomised click burst
    _spawnClickBurst(origin) {
      const cfg = Confetti.CONFIG;
      const originalCount = cfg.particle_count;
      const originalPower = cfg.explosion_power;

      cfg.particle_count = Math.max(15, Math.floor(originalCount * (0.1 + Math.random())));
      cfg.explosion_power = originalPower * (0.3 + Math.random() * 0.6);

      this.bursts.push(new ConfettiBurst(origin));

      cfg.particle_count = originalCount;
      cfg.explosion_power = originalPower;
    }
  
    static _getApproxCaretPosition(el) {
      return Confetti._getCaretPosition(el);
    }
  
    static _getCaretPosition(fallbackEl) {
      const active = document.activeElement || fallbackEl;
  
      // Determine correct Selection object (handles Shadow DOM)
      let sel = window.getSelection();
      if (active && active.getRootNode) {
        const root = active.getRootNode();
        if (root instanceof ShadowRoot && root.getSelection) {
          sel = root.getSelection() || sel;
        }
      }
  
      // INPUT / TEXTAREA path
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        const rect = active.getBoundingClientRect();
        try {
          if (typeof active.selectionStart === "number") {
            const div = document.createElement("div");
            const computed = window.getComputedStyle(active);
            for (const prop of [
              "fontSize",
              "fontFamily",
              "fontWeight",
              "whiteSpace",
              "letterSpacing",
              "textTransform",
              "paddingLeft",
              "paddingTop",
              "borderLeftWidth",
              "borderTopWidth",
            ]) {
              div.style[prop] = computed[prop];
            }
            div.style.position = "absolute";
            div.style.visibility = "hidden";
            div.style.whiteSpace = "pre-wrap";
            div.style.left = rect.left + "px";
            div.style.top = rect.top + "px";
            document.body.appendChild(div);
  
            const textBeforeCaret = active.value.substring(0, active.selectionStart);
            div.textContent = textBeforeCaret.replace(/\n/g, "\u200B\n");
            const span = document.createElement("span");
            span.textContent = "\u200B";
            div.appendChild(span);
  
            const spanRect = span.getBoundingClientRect();
            document.body.removeChild(div);
  
            return { x: spanRect.left, y: spanRect.top };
          }
        } catch (_) {}
      }
  
      // contentEditable or other elements (Notion etc.) — use Selection API
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0).cloneRange();
        range.collapse(false);
        const rect = range.getBoundingClientRect();
        if (rect && rect.width !== 0 && rect.height !== 0) {
          return { x: rect.left, y: rect.top };
        }
      }
  
      // Fallback to center of element or body
      const rect = (active && active.getBoundingClientRect) ? active.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  
    // Walks up DOM (including across shadow boundaries) to locate the nearest text input/textarea/contentEditable element
    static _findEditable(node) {
      let current = node;
      while (current && current !== document.body) {
        if (
          current instanceof HTMLInputElement ||
          current instanceof HTMLTextAreaElement ||
          (current instanceof HTMLElement && current.isContentEditable)
        ) {
          return current;
        }

        // If we're inside a shadow DOM, move to its host
        if (current.parentNode) {
          current = current.parentNode;
        } else if (current.host) {
          current = current.host;
        } else {
          break;
        }
      }
      return null;
    }
  
    _update(timestamp) {
      // Ensure canvas is still in the DOM (in case external scripts removed it)
      this._setupCanvas();

      this.delta_time = (timestamp - this.time) / 1000;
      this.time = timestamp;
  
      for (let i = this.bursts.length - 1; i >= 0; i -= 1) {
        const burst = this.bursts[i];
        burst.update(this.delta_time);
        if (burst.particles.length === 0) {
          this.bursts.splice(i, 1);
        }
      }
  
      this._draw();
  
      requestAnimationFrame(this._update);
    }
  
    _draw() {
      Screen.clear();
      for (let i = 0; i < this.bursts.length; i += 1) {
        this.bursts[i].draw();
      }
    }
  }

(function() {
    'use strict';
    
    let confetti;
    let isEnabled = true;
    
    const defaultSettings = {
        enabled: true,
        particleCount: 75,
        explosionPower: 25,
        particleSize: 1.0,
        gravity: 10,
        fade: true,
        fadeSpeed: 2.7
    };
    
    function initializeConfetti(settings) {
        if (confetti) {
            return;
        }
        
        confetti = new Confetti();
        applySettings(settings);
    }
    
    function applySettings(settings) {
        if (!confetti) return;
        
        Confetti.CONFIG.particle_count = settings.particleCount;
        Confetti.CONFIG.explosion_power = settings.explosionPower;
        Confetti.CONFIG.particle_size = settings.particleSize;
        Confetti.CONFIG.gravity = settings.gravity;
        Confetti.CONFIG.fade = settings.fade;
        Confetti.CONFIG.fade_speed = settings.fadeSpeed;
    }
    
    function disableConfetti() {
        if (confetti && Confetti.CANVAS) {
            Confetti.CANVAS.style.display = 'none';
            isEnabled = false;
        }
    }
    
    function enableConfetti() {
        if (confetti && Confetti.CANVAS) {
            Confetti.CANVAS.style.display = 'block';
            isEnabled = true;
        }
    }
    
    chrome.storage.sync.get(defaultSettings, function(settings) {
        isEnabled = settings.enabled;
        
        if (settings.enabled) {
            initializeConfetti(settings);
        }
    });
    
    chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
        if (request.action === 'updateSettings') {
            const settings = request.settings;
            
            if (settings.enabled && !isEnabled) {
                if (!confetti) {
                    initializeConfetti(settings);
                } else {
                    enableConfetti();
                    applySettings(settings);
                }
                isEnabled = true;
            } else if (!settings.enabled && isEnabled) {
                disableConfetti();
            } else if (settings.enabled && isEnabled) {
                applySettings(settings);
            }
            
            sendResponse({success: true});
        }
    });
})(); 