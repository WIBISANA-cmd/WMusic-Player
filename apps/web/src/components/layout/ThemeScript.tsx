export function ThemeScript() {
  const code = `
    (function() {
      try {
        var storage = localStorage.getItem('wmusic-theme-storage');
        if (storage) {
          var parsed = JSON.parse(storage);
          if (parsed && parsed.state && parsed.state.theme === 'dark') {
            document.documentElement.classList.add('dark');
            return;
          }
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          // Optional: follow system if no explicit preference yet
        }
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
