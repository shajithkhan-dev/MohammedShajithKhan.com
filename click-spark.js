// click-spark.js — vanilla JS, no React/build tools needed.
// Creates a full-page canvas and draws a small burst of lines on every click.

(function () {
  function init() {
    const root = document.getElementById('click-spark-root') || document.body;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.style.userSelect = 'none';
    root.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let sparks = [];

    const config = {
      sparkColor: '#e5dddd',
      sparkSize: 8,
      sparkRadius: 10,
      sparkCount: 8,
      duration: 500,
      easing: 'ease-out',
      extraScale: 1.0,
    };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function ease(t) {
      switch (config.easing) {
        case 'linear':     return t;
        case 'ease-in':     return t * t;
        case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:            return t * (2 - t); // ease-out
      }
    }

    function draw(timestamp) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparks = sparks.filter(spark => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= config.duration) return false;

        const progress   = elapsed / config.duration;
        const eased       = ease(progress);
        const distance    = eased * config.sparkRadius * config.extraScale;
        const lineLength  = config.sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = config.sparkColor;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    document.addEventListener('click', e => {
      const now = performance.now();
      const newSparks = Array.from({ length: config.sparkCount }, (_, i) => ({
        x: e.clientX,
        y: e.clientY,
        angle: (2 * Math.PI * i) / config.sparkCount,
        startTime: now,
      }));
      sparks.push(...newSparks);
      // Debug line — open the console and click anywhere to confirm this fires.
      // Remove this once you've confirmed it's working.
      console.log('[click-spark] click registered at', e.clientX, e.clientY);
    });

    console.log('[click-spark] initialized — canvas appended to', root.id || 'document.body');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
