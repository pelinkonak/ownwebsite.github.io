function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
  }
  document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');
  
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      
      let theme = 'light';
      if (document.body.classList.contains('dark-mode')) {
        theme = 'dark';
      }
      localStorage.setItem('theme', theme);
    });
  });