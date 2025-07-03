// DARK MODE toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggleButtons = document.querySelectorAll('.theme-toggle');

  // Kayıtlı tema varsa onu uygula
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // Tema değiştir butonları için click event
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      localStorage.setItem('theme', currentTheme);
    });
  });
});

// HAMBURGER MENU toggle
function toggleMenu() {
  const menu = document.querySelector('.menu-links');
  const icon = document.querySelector('.hamburger-icon');

  menu.classList.toggle('open');
  icon.classList.toggle('open');
}
