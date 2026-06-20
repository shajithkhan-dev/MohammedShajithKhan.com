// react-mount.js — CircularText + LogoLoop. ClickSpark is handled separately by click-spark.js (vanilla JS).

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. CIRCULAR TEXT — hero section ── */
  const circularRoot = document.getElementById('circular-text-root');
  if (circularRoot && window.CircularText) {
    const circularApp = ReactDOM.createRoot(circularRoot);
    circularApp.render(
      React.createElement(window.CircularText, {
        text: ' Python * SQL * PowerBI * Excel * DAX * Pandas * Matplotlib *',
        onHover: 'goBonkers',
        spinDuration: 24,
        className: 'hero-circular-text',
      })
    );
  }

  /* ── 2. LOGO LOOP — skills section ── */
  const logoLoopRoot = document.getElementById('logoloop-root');
  if (logoLoopRoot && window.LogoLoop) {
    const logoChip = (src, alt) =>
      React.createElement('span', { className: 'logo-chip' },
        React.createElement('img', {
          src,
          alt,
          loading: 'lazy',
          decoding: 'async',
          draggable: false
        })
      );

    const textChip = label =>
      React.createElement('span', {
        className: 'logo-chip logo-chip--text',
        style: { alignSelf: 'center', verticalAlign: 'middle' }
      }, label);

    const techLogos = [
      { node: logoChip('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/960px-Python-logo-notext.svg.png', 'Python'), title: 'Python' },
      { node: logoChip('https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', 'SQL'), title: 'SQL' },
      { node: textChip('DAX'), title: 'DAX' },
      { node: logoChip('https://img.icons8.com/color/48/power-bi.png', 'Power BI'), title: 'Power BI' },
      { node: logoChip('https://cdn.pixabay.com/photo/2023/06/01/12/02/excel-logo-8033473_640.png', 'Excel'), title: 'Excel' },
      { node: logoChip('https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg', 'Pandas'), title: 'Pandas' },
      { node: logoChip('https://cdn.jsdelivr.net/gh/devicons/devicon/icons/matplotlib/matplotlib-original.svg', 'Matplotlib'), title: 'Matplotlib' },
    ];

    const logoLoopApp = ReactDOM.createRoot(logoLoopRoot);
    logoLoopApp.render(
      React.createElement(window.LogoLoop, {
        logos: techLogos,
        speed: 80,
        direction: 'left',
        logoHeight: 56,
        gap: 28,
        width: 'min(100%, 760px)',
        pauseOnHover: true,
        scaleOnHover: true,
        fadeOut: true,
        ariaLabel: 'Technical skills',
      })
    );
  }

});
